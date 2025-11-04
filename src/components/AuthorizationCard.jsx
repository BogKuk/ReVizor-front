import React, {useEffect, useState} from 'react';
import {KeyOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Card, Input, Space, Typography} from 'antd';
import axios from "axios";

const { Title } = Typography;

const AuthorizationCard = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:8000/authorization/login', {
                login,
                password
            });
            console.log('Ответ сервера:', response.data);
            // здесь можно делать редирект или сохранять токен
        } catch (error) {
            console.error('Ошибка при логине:', error);
            // здесь можно показать пользователю уведомление об ошибке
        }
    };

    return (
        <Card className={`fade-slide-up ${show ? 'show' : ''}`}
            title={
            <Title level={3} style={{ margin: 0 }}>
                Sign In to ReVizor
            </Title>
        } style={{
            width: 400,
            padding: 20,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            borderRadius: 12,
            textAlign: 'center',
        }}>
            <Space direction="vertical"
                   size="large"
                   style={{
                       width: '100%',
                   }}>
                <Input
                    placeholder="Username"
                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    size="large"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                />
                <Input.Password
                    placeholder="Password"
                    prefix = {<KeyOutlined style={{ color: 'rgba(0,0,0,.25)' }}/>}
                    size="large"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <Button type="primary" size="large" block onClick={handleLogin}>
                    Sign In
                </Button>
            </Space>
        </Card>
    );
};
export default AuthorizationCard;
