import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Initialize data files with empty arrays if they don't exist
async function initializeDataFiles() {
    const files = ['tournaments.json', 'teams.json', 'matches.json'];
    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, '[]', 'utf8');
        }
    }
}

async function readJson(filename) {
    try {
        const text = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
        return JSON.parse(text);
    } catch (e) {
        console.error(`Error reading ${filename}:`, e);
        return [];
    }
}

async function writeJson(filename, data) {
    try {
        await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`Error writing ${filename}:`, e);
        throw e;
    }
}

// Функция для преобразования JSON в XML
function jsonToXml(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<matches>\n';

    data.forEach(match => {
        xml += '  <match>\n';
        xml += `    <id>${match.id}</id>\n`;
        xml += `    <tournamentId>${match.tournamentId}</tournamentId>\n`;
        xml += `    <teamAId>${match.teamAId}</teamAId>\n`;
        xml += `    <teamBId>${match.teamBId}</teamBId>\n`;
        xml += `    <status>${match.status}</status>\n`;
        xml += `    <scheduledTime>${match.scheduledTime}</scheduledTime>\n`;
        xml += `    <createdAt>${match.createdAt}</createdAt>\n`;

        if (match.result) {
            xml += '    <result>\n';
            xml += `      <scoreA>${match.result.scoreA}</scoreA>\n`;
            xml += `      <scoreB>${match.result.scoreB}</scoreB>\n`;
            xml += `      <timestamp>${match.result.ts}</timestamp>\n`;
            xml += '    </result>\n';
        }

        if (match.history && match.history.length > 0) {
            xml += '    <history>\n';
            match.history.forEach(historyItem => {
                xml += '      <entry>\n';
                xml += `        <action>${historyItem.action}</action>\n`;
                xml += `        <timestamp>${historyItem.ts}</timestamp>\n`;
                if (historyItem.scoreA !== undefined) {
                    xml += `        <scoreA>${historyItem.scoreA}</scoreA>\n`;
                }
                if (historyItem.scoreB !== undefined) {
                    xml += `        <scoreB>${historyItem.scoreB}</scoreB>\n`;
                }
                xml += '      </entry>\n';
            });
            xml += '    </history>\n';
        }

        xml += '  </match>\n';
    });

    xml += '</matches>';
    return xml;
}

// Функция для создания HTML таблицы
function jsonToHtml(data) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Matches Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .result { font-weight: bold; color: #2c5f2d; }
        .status-scheduled { color: #666; }
        .status-completed { color: #2c5f2d; }
    </style>
</head>
<body>
    <h1>Tournament Matches Report</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <table>
        <thead>
            <tr>
                <th>Match ID</th>
                <th>Tournament</th>
                <th>Team A</th>
                <th>Team B</th>
                <th>Status</th>
                <th>Result</th>
                <th>Scheduled Time</th>
            </tr>
        </thead>
        <tbody>`;

    data.forEach(match => {
        const result = match.result ? `${match.result.scoreA} - ${match.result.scoreB}` : 'Not played';
        const statusClass = match.status === 'completed' ? 'status-completed' : 'status-scheduled';

        html += `
            <tr>
                <td>${match.id}</td>
                <td>${match.tournamentId}</td>
                <td>${match.teamAId}</td>
                <td>${match.teamBId}</td>
                <td class="${statusClass}">${match.status}</td>
                <td class="result">${result}</td>
                <td>${new Date(match.scheduledTime).toLocaleString()}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>
    <p>Total matches: ${data.length}</p>
</body>
</html>`;

    return html;
}

// ================= API =================

// Получить все турниры
app.get('/api/tournaments', async (req, res) => {
    try {
        const tournaments = await readJson('tournaments.json');
        res.json(tournaments);
    } catch (e) {
        console.error('Error in /api/tournaments:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Получить все команды
app.get('/api/teams', async (req, res) => {
    try {
        const teams = await readJson('teams.json');
        res.json(teams);
    } catch (e) {
        console.error('Error in /api/teams:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Получить все матчи с названиями команд
app.get('/api/matches', async (req, res) => {
    try {
        const matches = await readJson('matches.json');
        const teams = await readJson('teams.json');

        const result = matches.map(m => {
            const teamA = teams.find(t => t.id === m.teamAId)?.name || m.teamAId;
            const teamB = teams.find(t => t.id === m.teamBId)?.name || m.teamBId;
            return { ...m, teamA, teamB };
        });

        res.json(result);
    } catch (e) {
        console.error('Error in /api/matches:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Создать новую команду
app.post('/api/teams', async (req, res) => {
    try {
        const { name, members = [], meta = {} } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Название команды обязательно' });
        }

        const teams = await readJson('teams.json');

        // Проверяем, существует ли команда с таким именем
        const existingTeam = teams.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (existingTeam) {
            return res.status(400).json({ message: 'Команда с таким названием уже существует' });
        }

        const newTeam = {
            id: uuidv4(),
            name: name.trim(),
            members: Array.isArray(members) ? members : [],
            meta: typeof meta === 'object' ? meta : {}
        };

        teams.push(newTeam);
        await writeJson('teams.json', teams);

        res.status(201).json(newTeam);
    } catch (e) {
        console.error('Error in /api/teams POST:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Удалить команду
app.delete('/api/teams/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        const teams = await readJson('teams.json');
        const tournaments = await readJson('tournaments.json');
        const matches = await readJson('matches.json');

        // Находим команду
        const teamIndex = teams.findIndex(t => String(t.id) === String(teamId));
        if (teamIndex === -1) {
            return res.status(404).json({ message: 'Команда не найдена' });
        }

        // Удаляем команду из турниров
        const updatedTournaments = tournaments.map(tournament => {
            if (tournament.participants) {
                tournament.participants = tournament.participants.filter(pid => String(pid) !== String(teamId));
            }
            return tournament;
        });

        // Удаляем матчи с участием этой команды
        const updatedMatches = matches.filter(match =>
            String(match.teamAId) !== String(teamId) && String(match.teamBId) !== String(teamId)
        );

        // Удаляем саму команду
        teams.splice(teamIndex, 1);

        // Сохраняем изменения
        await writeJson('teams.json', teams);
        await writeJson('tournaments.json', updatedTournaments);
        await writeJson('matches.json', updatedMatches);

        res.json({ ok: true, message: 'Команда удалена' });
    } catch (e) {
        console.error('Error in /api/teams DELETE:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Регистрация команды на турнир
app.post('/api/register', async (req, res) => {
    try {
        const { tournamentId, team } = req.body;
        console.log('Registration request:', { tournamentId, team });

        if (!tournamentId || !team?.name) {
            return res.status(400).json({ message: 'tournamentId и team.name обязательны' });
        }

        const tournaments = await readJson('tournaments.json');
        const teams = await readJson('teams.json');

        let existingTeam = teams.find(t => t.name === team.name);
        if (!existingTeam) {
            existingTeam = {
                id: uuidv4(),
                name: team.name,
                members: Array.isArray(team.members) ? team.members : [],
                meta: team.meta || {}
            };
            teams.push(existingTeam);
            await writeJson('teams.json', teams);
        }

        const tournament = tournaments.find(t => String(t.id) === String(tournamentId));
        if (!tournament) {
            return res.status(400).json({ message: 'Турнир не найден' });
        }

        tournament.participants = tournament.participants || [];
        if (!tournament.participants.includes(existingTeam.id)) {
            tournament.participants.push(existingTeam.id);
            await writeJson('tournaments.json', tournaments);
        }

        res.json({
            success: true,
            tournament: {
                ...tournament,
                participants: tournament.participants
            },
            team: existingTeam
        });
    } catch (e) {
        console.error('Error in /api/register:', e);
        res.status(500).json({
            message: 'Ошибка сервера при регистрации',
            error: e.message
        });
    }
});

// Создать новый матч
app.post('/api/matches', async (req, res) => {
    try {
        const { tournamentId, teamAId, teamBId, scheduledTime } = req.body;

        if (!tournamentId || !teamAId || !teamBId) {
            return res.status(400).json({
                message: 'tournamentId, teamAId и teamBId обязательны'
            });
        }

        // Проверяем существование команд
        const teams = await readJson('teams.json');
        const teamA = teams.find(t => String(t.id) === String(teamAId));
        const teamB = teams.find(t => String(t.id) === String(teamBId));

        if (!teamA || !teamB) {
            return res.status(400).json({ message: 'Одна из команд не найдена' });
        }

        const matches = await readJson('matches.json');

        const newMatch = {
            id: uuidv4(),
            tournamentId,
            teamAId,
            teamBId,
            scheduledTime: scheduledTime || new Date().toISOString(),
            status: 'scheduled',
            history: [],
            createdAt: new Date().toISOString()
        };

        matches.push(newMatch);
        await writeJson('matches.json', matches);

        // Добавляем названия команд для ответа
        const matchWithTeamNames = {
            ...newMatch,
            teamA: teamA.name,
            teamB: teamB.name
        };

        res.status(201).json(matchWithTeamNames);
    } catch (e) {
        console.error('Error in /api/matches POST:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Добавление результата матча
app.post('/api/match-result', async (req, res) => {
    try {
        const { matchId, scoreA, scoreB } = req.body;
        console.log('Match result request:', { matchId, scoreA, scoreB });

        if (!matchId || scoreA === undefined || scoreB === undefined) {
            return res.status(400).json({
                message: 'matchId, scoreA, scoreB обязательны'
            });
        }

        const matches = await readJson('matches.json');
        const match = matches.find(m => String(m.id) === String(matchId));
        if (!match) {
            return res.status(404).json({ message: 'Матч не найден' });
        }

        match.result = {
            scoreA: Number(scoreA),
            scoreB: Number(scoreB),
            ts: new Date().toISOString()
        };
        match.status = 'completed';
        match.history = match.history || [];
        match.history.push({
            action: 'result_added',
            scoreA: Number(scoreA),
            scoreB: Number(scoreB),
            ts: new Date().toISOString()
        });

        await writeJson('matches.json', matches);

        // Получаем названия команд для ответа
        const teams = await readJson('teams.json');
        const teamA = teams.find(t => t.id === match.teamAId)?.name || match.teamAId;
        const teamB = teams.find(t => t.id === match.teamBId)?.name || match.teamBId;

        res.json({
            ...match,
            teamA,
            teamB,
            success: true
        });
    } catch (e) {
        console.error('Error in /api/match-result:', e);
        res.status(500).json({
            message: 'Ошибка сервера при добавлении результата',
            error: e.message
        });
    }
});

// Удаление результата матча
app.delete('/api/match-result/:matchId', async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const matches = await readJson('matches.json');
        const match = matches.find(m => String(m.id) === String(matchId));

        if (!match) {
            return res.status(404).json({ message: 'Матч не найден' });
        }

        if (!match.result) {
            return res.status(400).json({ message: 'У матча нет результата для удаления' });
        }

        // Сохраняем старый результат в историю
        match.history = match.history || [];
        match.history.push({
            action: 'result_removed',
            oldScoreA: match.result.scoreA,
            oldScoreB: match.result.scoreB,
            ts: new Date().toISOString()
        });

        // Удаляем результат
        delete match.result;
        match.status = 'scheduled';

        await writeJson('matches.json', matches);

        // Получаем названия команд для ответа
        const teams = await readJson('teams.json');
        const teamA = teams.find(t => t.id === match.teamAId)?.name || match.teamAId;
        const teamB = teams.find(t => t.id === match.teamBId)?.name || match.teamBId;

        res.json({
            ...match,
            teamA,
            teamB,
            message: 'Результат матча удален',
            success: true
        });
    } catch (e) {
        console.error('Error in /api/match-result DELETE:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Удаление матча
app.delete('/api/match/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const matches = await readJson('matches.json');
        const idx = matches.findIndex(m => String(m.id) === String(id));
        if (idx === -1) {
            return res.status(404).json({ message: 'Матч не найден' });
        }

        matches.splice(idx, 1);
        await writeJson('matches.json', matches);
        res.json({ ok: true, message: 'Матч удален' });
    } catch (e) {
        console.error('Error in /api/match DELETE:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Скачивание файлов - ИСПРАВЛЕННАЯ ВЕРСИЯ
app.get('/download', async (req, res) => {
    const format = req.query.format?.toLowerCase();
    if (!format) return res.status(400).send('Формат не указан');

    try {
        const matches = await readJson('matches.json');
        const teams = await readJson('teams.json');

        // Обогащаем данные названиями команд
        const enrichedMatches = matches.map(match => ({
            ...match,
            teamAName: teams.find(t => t.id === match.teamAId)?.name || match.teamAId,
            teamBName: teams.find(t => t.id === match.teamBId)?.name || match.teamBId
        }));

        if (format === 'json') {
            const filePath = path.join(DATA_DIR, 'matches.json');
            return res.download(filePath, 'matches.json');
        }

        if (format === 'xml') {
            const xml = jsonToXml(enrichedMatches);
            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', 'attachment; filename="matches.xml"');
            return res.send(xml);
        }

        if (format === 'html') {
            const html = jsonToHtml(enrichedMatches);
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Disposition', 'attachment; filename="matches.html"');
            return res.send(html);
        }

        return res.status(400).send('Неподдерживаемый формат. Используйте: json, xml, html');
    } catch (e) {
        console.error('Download error:', e);
        res.status(500).send('Ошибка при формировании файла: ' + e.message);
    }
});

// Получить матчи по турниру
app.get('/api/tournaments/:id/matches', async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const matches = await readJson('matches.json');
        const teams = await readJson('teams.json');

        const tournamentMatches = matches
            .filter(m => String(m.tournamentId) === String(tournamentId))
            .map(m => {
                const teamA = teams.find(t => t.id === m.teamAId)?.name || m.teamAId;
                const teamB = teams.find(t => t.id === m.teamBId)?.name || m.teamBId;
                return { ...m, teamA, teamB };
            });

        res.json(tournamentMatches);
    } catch (e) {
        console.error('Error in /api/tournaments/:id/matches:', e);
        res.status(500).json({ message: 'Ошибка сервера', error: e.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: {
            tournaments: '/api/tournaments',
            teams: '/api/teams',
            matches: '/api/matches',
            download: '/download?format=json|xml|html'
        }
    });
});

// Главная страница
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Tournament Platform API</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #333; }
                    .endpoint { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 5px; }
                    .method { display: inline-block; width: 80px; font-weight: bold; }
                    .get { color: green; }
                    .post { color: orange; }
                    .delete { color: red; }
                </style>
            </head>
            <body>
                <h1>🎯 Tournament Platform API</h1>
                <p>Server is running successfully! Available endpoints:</p>
                
                <div class="endpoint"><span class="method get">GET</span> /api/health - Health check</div>
                <div class="endpoint"><span class="method get">GET</span> /api/tournaments - Get all tournaments</div>
                <div class="endpoint"><span class="method get">GET</span> /api/teams - Get all teams</div>
                <div class="endpoint"><span class="method get">GET</span> /api/matches - Get all matches</div>
                <div class="endpoint"><span class="method post">POST</span> /api/teams - Create new team</div>
                <div class="endpoint"><span class="method post">POST</span> /api/register - Register team for tournament</div>
                <div class="endpoint"><span class="method post">POST</span> /api/matches - Create new match</div>
                <div class="endpoint"><span class="method post">POST</span> /api/match-result - Add match result</div>
                <div class="endpoint"><span class="method get">GET</span> /download?format=json|xml|html - Download matches</div>
                
                <p><a href="/api/health">Check API health</a> | <a href="/download?format=html">Download HTML report</a></p>
            </body>
        </html>
    `);
});

// Инициализация и запуск сервера
async function startServer() {
    try {
        await ensureDataDir();
        await initializeDataFiles();

        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
            console.log('📋 Available endpoints:');
            console.log('GET  /api/health');
            console.log('GET  /api/tournaments');
            console.log('GET  /api/teams');
            console.log('GET  /api/matches');
            console.log('POST /api/teams');
            console.log('POST /api/register');
            console.log('POST /api/matches');
            console.log('POST /api/match-result');
            console.log('GET  /download?format=json|xml|html');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();