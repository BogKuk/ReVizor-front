import React, {useContext, useEffect, useState} from 'react';
import {KeyOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Card, Input, Space, Typography} from 'antd';
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { AuthContext  } from "../context/AuthContext.jsx";

const { Title } = Typography;

const AuthorizationCard = () => {
    const navigate = useNavigate();
    const { login: loginContext } = useContext(AuthContext);
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [exit, setExit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        setStatus("");
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/authorization/login',
                { login, password },
                { withCredentials: true, headers: { "Content-Type": "application/json" } }
            );

            loginContext(response.data.access_token);

            setExit(true);

            setTimeout(() => {
                navigate("/");
            }, 1000);

        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Incorrect Username or Password');
                setStatus('error');
            } else {
                setError('Server Error, please try again later');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`fade-slide-up ${show ? 'show' : ''} ${exit ? 'exit' : ''}`}
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
                    status={status}
                    placeholder="Username"
                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    size="large"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                />
                <Input.Password
                    status={status}
                    placeholder="Password"
                    prefix = {<KeyOutlined style={{ color: 'rgba(0,0,0,.25)' }}/>}
                    size="large"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                {error && <Typography.Text type="danger">{error}</Typography.Text>}
                <Button type="primary" size="large" block onClick={handleLogin} loading={loading}>
                    Sign In
                </Button>
            </Space>
        </Card>
    );
};
export default AuthorizationCard;
