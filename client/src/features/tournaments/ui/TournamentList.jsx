import React, { useEffect, useState } from 'react';
import { tournamentsApi } from '../api/tournamentsApi';

export default function TournamentList() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        tournamentsApi.getAll()
            .then(data => setTournaments(data))
            .catch(() => setError('Ошибка загрузки турниров'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Загрузка турниров...</p>;
    if (error) return <p>{error}</p>;

    return (
        <section>
            <h2>Турниры</h2>
            {tournaments.length === 0 ? (
                <p>Нет турниров</p>
            ) : (
                <ul>
                    {tournaments.map(t => (
                        <li key={t.id}>
                            <strong>{t.title}</strong> — {t.date} — участники: {(t.participants || []).length}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
