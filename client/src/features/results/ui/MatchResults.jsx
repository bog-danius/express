import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { resultsApi } from '../api/resultsApi';

// Стили
const Section = styled.section`
  margin-top: 24px;
  background: #f7f8fa;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
`;

const MatchItem = styled.li`
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
`;

const Button = styled.button`
  margin-left: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background-color: ${props => props.$delete ? '#dc3545' : '#007BFF'};
  transition: background-color 0.2s;
  &:hover {
    background-color: ${props => props.$delete ? '#a71d2a' : '#0056b3'};
  }
`;

const Message = styled.div`
  margin-top: 12px;
  color: ${props => (props.error ? '#dc3545' : '#28a745')};
  font-weight: 500;
`;

export default function MatchResults() {
    const [matches, setMatches] = useState([]);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState(false);
    const [loadingId, setLoadingId] = useState(null);

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        try {
            const data = await resultsApi.getMatches();
            setMatches(data);
        } catch (err) {
            console.error(err);
            setError(true);
            setMsg('Ошибка загрузки матчей');
        }
    };

    const submitResult = async (id) => {
        const scoreA = prompt('Счёт команды A', '0');
        const scoreB = prompt('Счёт команды B', '0');
        if (scoreA === null || scoreB === null) return;

        setLoadingId(id);
        try {
            await resultsApi.sendResult(id, Number(scoreA), Number(scoreB));
            setError(false);
            setMsg('Результат сохранён');
            loadMatches();
        } catch (err) {
            console.error(err);
            setError(true);
            setMsg('Ошибка при сохранении результата');
        } finally {
            setLoadingId(null);
        }
    };

    const eleteMatch = async (id) => {
        if (!confirm('Удалить матч?')) return;

        setLoadingId(id);
        try {
            await resultsApi.deleteMatch(id);
            setError(false);
            setMsg('Матч удалён');
            loadMatches();
        } catch (err) {
            console.error(err);
            setError(true);
            setMsg('Ошибка удаления матча');
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <Section>
            <h3>Матчи</h3>
            {matches.length === 0 ? (
                <p>Матчи отсутствуют</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {matches.map((m) => (
                        <MatchItem key={m.id}>
              <span>
                {m.id}: {m.teamA} vs {m.teamB} — {m.scheduled}
                  {m.result ? ` — ${m.result.scoreA}:${m.result.scoreB}` : ''}
              </span>
                            <div>
                                <Button
                                    onClick={() => submitResult(m.id)}
                                    disabled={loadingId === m.id}
                                >
                                    {loadingId === m.id ? 'Сохраняем...' : 'Добавить результат'}
                                </Button>
                                <Button
                                    $delete
                                    onClick={() => deleteMatch(m.id)}
                                    disabled={loadingId === m.id}
                                >
                                    {loadingId === m.id ? 'Удаляем...' : 'Удалить'}
                                </Button>
                            </div>
                        </MatchItem>
                    ))}
                </ul>
            )}
            {msg && <Message error={error}>{msg}</Message>}
        </Section>
    );
}
