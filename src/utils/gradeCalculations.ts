export function getGradeInfo(score: number): { grade: string; remarks: string; color: string } {
  if (score >= 80) return { grade: '4.0', remarks: 'ดีเยี่ยม', color: 'text-emerald-700 font-semibold' };
  if (score >= 75) return { grade: '3.5', remarks: 'ดีมาก', color: 'text-emerald-600 font-medium' };
  if (score >= 70) return { grade: '3.0', remarks: 'ดี', color: 'text-blue-700 font-medium' };
  if (score >= 65) return { grade: '2.5', remarks: 'ค่อนข้างดี', color: 'text-blue-600' };
  if (score >= 60) return { grade: '2.0', remarks: 'ปานกลาง', color: 'text-amber-700' };
  if (score >= 55) return { grade: '1.5', remarks: 'พอใช้', color: 'text-amber-600' };
  if (score >= 50) return { grade: '1.0', remarks: 'ผ่านเกณฑ์', color: 'text-slate-700' };
  return { grade: '0', remarks: 'ควรปรับปรุง', color: 'text-rose-600 font-medium' };
}

export function calculateSummary(scores: number[], maxScores: number[] = []) {
  const totalEarned = scores.reduce((sum, s) => sum + (isNaN(s) ? 0 : s), 0);
  const totalMax = maxScores.length > 0 
    ? maxScores.reduce((sum, m) => sum + (isNaN(m) ? 100 : m), 0)
    : scores.length * 100;
  
  const percentage = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  const gradeInfo = getGradeInfo(percentage);

  return {
    totalEarned,
    totalMax,
    percentage: Number(percentage.toFixed(2)),
    gradeInfo
  };
}

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    return row;
  });
}
