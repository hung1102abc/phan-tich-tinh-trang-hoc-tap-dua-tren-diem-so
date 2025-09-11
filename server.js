const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());




const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA7vBEMczkBtMGwUA-2SeYvyBD2cDSvXaw';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Phân tích AI cho một sinh viên (dùng cho nút Phân tích từng thẻ)
app.post('/analyzeOne', express.json(), async (req, res) => {
    const student = req.body.student;
    if (!student || !student.name) {
        return res.status(400).json({ error: 'Thiếu thông tin sinh viên.' });
    }
    try {
        const aiComment = await getAIComment({
            name: student.name,
            average: student.tbc_ht10,
            grade: student.grade,
            rl: student.rl
        });
        return res.json({ aiComment });
    } catch (e) {
        return res.json({ aiComment: 'Không thể sinh nhận xét AI.' });
    }
});

async function getAIComment(student) {
    const prompt = `Bạn là một giảng viên giỏi, công việc của bạn là nhận xét chi tiết Sinh Viên về kết quả học tập và đề xuất hướng cải thiện. Đây là sinh viên bạn cần nhận xét, Sinh Viên: ${student.name}, điểm số: ${student.average}. Hãy nhận xét thật chi tiết về kết quả học tập, phân tích điểm mạnh/yếu, và đề xuất nhiều hướng cải thiện cụ thể, bao gồm:
    - Các khoá học online, sách, tài liệu, website hữu ích
    - Kỹ năng mềm, kỹ năng tự học, kỹ năng quản lý thời gian
    - Thói quen học tập, phương pháp ghi nhớ, cách ôn luyện hiệu quả
    - Đề xuất hoạt động ngoại khoá, nhóm học tập, câu lạc bộ
    - Gợi ý các nguồn học miễn phí, các nền tảng học tập uy tín
    - Đưa ra ví dụ cụ thể, danh sách rõ ràng
    - Nội dung dài khoảng 400 từ, vừa đủ chi tiết, không lan man
    Đừng dùng "Dưới đây là" mà hãy đi thẳng vào nhận xét. Hãy phản hồi bằng văn bản thuần, không dùng kí tự đặc biệt.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                thinkingConfig: {
                    thinkingBudget: 0,
                },
            },
        });
        if (response && response.text) {
            return response.text.trim();
        } else {
            return 'Không thể sinh nhận xét AI (Gemini).';
        }
    } catch (e) {
        console.error('Lỗi Gemini:', e.message);
        return 'Không thể sinh nhận xét AI (Gemini).';
    }
}


// Biến lưu dữ liệu học sinh tạm thời (có thể thay bằng DB nếu cần)
let uploadedStudents = [];

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    if (jsonData.length > 0) {
        console.log('Các tên cột thực tế:', Object.keys(jsonData[0]));
    }
    // Chuẩn hóa tên cột: loại bỏ dấu cách, ký tự đặc biệt, chuyển về không dấu và thường
    function normalizeColName(str) {
        return String(str)
            .replace(/[\n\r]+/g, ' ')
            .replace(/\s+/g, '')
            .replace(/[ÀÁÂÃÄÅàáâãäå]/g, 'a')
            .replace(/[ÈÉÊËèéêë]/g, 'e')
            .replace(/[ÌÍÎÏìíîï]/g, 'i')
            .replace(/[ÒÓÔÕÖØòóôõöø]/g, 'o')
            .replace(/[ÙÚÛÜùúûü]/g, 'u')
            .replace(/[ỲÝỴỶỸỳýỵỷỹ]/g, 'y')
            .replace(/[Đđ]/g, 'd')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
    }
    function buildColMap(obj) {
        const map = {};
        for (const k of Object.keys(obj)) {
            map[normalizeColName(k)] = k;
        }
        return map;
    }
    const colMap = buildColMap(jsonData[0]);
    const students = jsonData.map((row, index) => {
        const nameKey = colMap[normalizeColName('Họ và tên')];
        const classKey = colMap[normalizeColName('Lớp')];
        const gradeKey = colMap[normalizeColName('Xếp loại')];
        const tbcKey = colMap[normalizeColName('TBCHT H10')];
        const rlKey = colMap[normalizeColName('Điểm RL')];
        function findColKey(keys, target) {
            return keys.find(k => normalizeColName(k) === normalizeColName(target));
        }
        const allKeys = Object.keys(row);
        const scoreKeys = [
            findColKey(allKeys, 'Kì 1 Năm I'),
            findColKey(allKeys, 'Kì 2 Năm I'),
            findColKey(allKeys, 'Kì 3 Năm I'),
            findColKey(allKeys, 'Kì 1 Năm II'),
            findColKey(allKeys, 'Kì 2 Năm II'),
            findColKey(allKeys, 'Kì 3 Năm II')
        ];
        let scores = scoreKeys.map(k => k ? parseFloat(row[k]) || 0 : 0);
        return {
            id: index + 1,
            name: row[nameKey] ? String(row[nameKey]).trim() : 'N/A',
            class: row[classKey] ? String(row[classKey]).trim() : 'N/A',
            grade: row[gradeKey] ? String(row[gradeKey]).trim() : 'N/A',
            tbc_ht10: row[tbcKey] ? parseFloat(row[tbcKey]) || 0 : 0,
            rl: row[rlKey] ? parseFloat(row[rlKey]) || 0 : 0,
            scores: scores
        };
    }).filter(s => s.name !== 'N/A' && s.class !== 'N/A');
    uploadedStudents = students;
    res.json({ students });
});

// API phân tích AI khi người dùng nhấn nút Phân tích
app.post('/analyze', async (req, res) => {
    if (!uploadedStudents || uploadedStudents.length === 0) {
        return res.status(400).json({ error: 'Chưa có dữ liệu học sinh để phân tích.' });
    }
    const studentsWithAI = await Promise.all(uploadedStudents.map(async (student) => {
        try {
            const aiComment = await getAIComment({
                name: student.name,
                average: student.tbc_ht10,
                grade: student.grade,
                rl: student.rl
            });
            return { ...student, aiComment };
        } catch (e) {
            console.error('Lỗi khi gọi Gemini cho học sinh', student.name, e);
            return { ...student, aiComment: 'Không thể sinh nhận xét AI.' };
        }
    }));
    res.json({ students: studentsWithAI });
});

app.listen(3001, () => {
    console.log('Backend server running at http://localhost:3001');
});
