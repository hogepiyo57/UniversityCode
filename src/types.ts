export type CodeRecord = {
  code: string;
  faculty: string;
  department: string;
};

export type University = {
  code: string;
  name: string;
  reading: string;
  aliases: string[];
  records: CodeRecord[];
};

export type UniversityData = {
  generatedAt: string;
  universities: University[];
};
