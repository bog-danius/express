import { useState, useEffect } from 'react';
import api from '../../../shared/api/axiosInstance';
import styled from 'styled-components';
import { registrationApi } from '../api/registrationApi';

const FormWrapper = styled.div`
    background: #f9f9f9;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    width: 360px;
    max-width: 100%;
    margin: 20px 0;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const Input = styled.input`
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
    &:focus {
        outline: none;
        border-color: #007BFF;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
    }
`;

const Select = styled.select`
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
    &:focus {
        outline: none;
        border-color: #007BFF;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
    }
`;

const Button = styled.button`
  padding: 10px;
  border-radius: 6px;
  border: none;
  background-color: #007BFF;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #0056b3;
  }
  &:disabled {
    background-color: #a0c4ff;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  color: ${props => (props.$error ? '#dc3545' : '#28a745')};
  font-size: 14px;
  margin-top: 4px;
`;

export default function RegisterForm() {
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/tournaments')
            .then(res => setTournaments(res.data))
            .catch(() => {
                setError(true);
                setMessage('Ошибка загрузки турниров');
            });
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(false);

        if (!teamName.trim() || !members.trim() || !selectedTournament) {
            setError(true);
            setMessage('Заполните все поля!');
            return;
        }

        setLoading(true);
        try {
            const response = await registrationApi.register(selectedTournament, {
                name: teamName.trim(),
                members: members.split(',').map(m => m.trim())
            });

            setError(false);
            setMessage('Команда успешно зарегистрирована!');
            setTeamName('');
            setMembers('');
            setSelectedTournament('');
        } catch (err) {
            console.error(err);
            setError(true);
            setMessage(err.response?.data?.message || 'Ошибка регистрации команды.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <FormWrapper>
            <h3>Регистрация команды</h3>
            <Form onSubmit={handleSubmit}>
                <Select
                    value={selectedTournament}
                    onChange={e => setSelectedTournament(e.target.value)}
                >
                    <option value="">Выберите турнир</option>
                    {tournaments.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.title} ({t.date})
                        </option>
                    ))}
                </Select>
                <Input
                    type="text"
                    placeholder="Название команды"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                />
                <Input
                    type="text"
                    placeholder="Участники через запятую"
                    value={members}
                    onChange={e => setMembers(e.target.value)}
                />
                <Button type="submit" disabled={loading}>
                    {loading ? 'Регистрация...' : 'Зарегистрировать команду'}
                </Button>
                {message && <Message $error={error}>{message}</Message>}
            </Form>
        </FormWrapper>
    );
}
