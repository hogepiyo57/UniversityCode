import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { parse } from 'csv-parse/sync';

const root = process.cwd();
const sourcePath = path.join(root, '大学名称2526.csv');
const readingsPath = path.join(root, 'data', 'university-readings.csv');
const outputPath = path.join(root, 'public', 'data', 'universities.json');
const validateOnly = process.argv.includes('--validate-only');

const clean = (value) => String(value ?? '').replace(/^'+/, '').trim();
const csvOptions = { columns: true, skip_empty_lines: true, relax_column_count: false };

function readSourceRows() {
  const decoded = iconv.decode(fs.readFileSync(sourcePath), 'cp932');
  return parse(decoded, csvOptions).map((row) => ({
    universityCode: clean(row["'大学ｺｰﾄﾞ"]),
    facultyCode: clean(row["'学部ｺｰﾄﾞ"]),
    departmentCode: clean(row["'学科ｺｰﾄﾞ"]),
    universityName: clean(row["'大学名"]),
    facultyName: clean(row["'学部名"]),
    departmentName: clean(row["'学科名"]),
    recruitmentUnit: clean(row["'募集単位"]),
  })).filter((row) => row.recruitmentUnit !== '0');
}

function readReadings() {
  if (!fs.existsSync(readingsPath)) {
    throw new Error(`読み仮名対応表がありません: ${readingsPath}\n先に pnpm data:collect を実行し、data/university-readings.csv を確認してください。`);
  }

  const rows = parse(fs.readFileSync(readingsPath, 'utf8'), { ...csvOptions, bom: true });
  const mapping = new Map();
  for (const row of rows) {
    const code = clean(row.universityCode);
    if (!code) continue;
    if (mapping.has(code)) throw new Error(`読み仮名対応表に大学コードの重複があります: ${code}`);
    mapping.set(code, {
      reading: clean(row.reading) || clean(row.notes),
      aliases: clean(row.aliases).split('|').map(clean).filter(Boolean),
    });
  }
  return mapping;
}

function validateRows(rows) {
  if (rows.length !== 7724) throw new Error(`前処理後の行数が不正です: ${rows.length}（想定: 7724）`);
  const universityCodes = new Set(rows.map((row) => row.universityCode));
  if (universityCodes.size !== 1369) throw new Error(`大学数が不正です: ${universityCodes.size}（想定: 1369）`);
  for (const row of rows) {
    if (row.recruitmentUnit === '0') throw new Error('募集単位 = 0 の行が残っています。');
    if (!/^\d{4}$/.test(row.universityCode) || !/^\d{2}$/.test(row.facultyCode) || !/^\d{2}$/.test(row.departmentCode)) {
      throw new Error(`コード形式が不正です: ${JSON.stringify(row)}`);
    }
  }
}

function buildData(rows, readings) {
  const universities = new Map();
  for (const row of rows) {
    const reading = readings.get(row.universityCode);
    if (!reading?.reading) throw new Error(`主読みがありません: ${row.universityCode} ${row.universityName}`);

    if (!universities.has(row.universityCode)) {
      universities.set(row.universityCode, {
        code: row.universityCode,
        name: row.universityName,
        reading: reading.reading,
        aliases: reading.aliases,
        records: [],
      });
    }
    universities.get(row.universityCode).records.push({
      code: `${row.universityCode}-${row.facultyCode}-${row.departmentCode}`,
      faculty: row.facultyName,
      department: row.departmentName,
    });
  }
  return [...universities.values()].sort((a, b) => a.reading.localeCompare(b.reading, 'ja'));
}

try {
  const rows = readSourceRows();
  validateRows(rows);
  const readings = readReadings();
  const universities = buildData(rows, readings);
  if (validateOnly) {
    console.log(`検証成功: ${rows.length}レコード、${universities.length}大学`);
  } else {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const sourceUpdatedAt = fs.statSync(sourcePath).mtime.toISOString();
    fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: sourceUpdatedAt, universities }, null, 2)}\n`, 'utf8');
    console.log(`生成成功: ${outputPath}（${universities.length}大学、${rows.length}レコード）`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
