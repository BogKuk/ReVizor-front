import React, { useEffect, useState, useContext } from 'react';
import { Button, List, Typography } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

const SidebarList = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { accessToken } = useContext(AuthContext);

    const fetchModels = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://127.0.0.1:8000/analysis/models/names', {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            setModels(Array.isArray(response.data) ? response.data : []);
        } catch {
            setError('Не удалось загрузить модели');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchModels();
        }
        const handler = () => {
            if (accessToken) {
                fetchModels();
            }
        };
        window.addEventListener('models-updated', handler);
        return () => window.removeEventListener('models-updated', handler);
    }, [accessToken]);

    return (
        <div
            style={{
                position: 'fixed',
                left: 12,
                top: 12,
                height: 'calc(100vh - 24px)',
                width: 320,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <div style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>
                <Button type="primary" icon={<PlusCircleOutlined />} block>
                    Add analysis
                </Button>
                {error && (
                    <Typography.Text type="danger" style={{ marginTop: 8, display: 'block' }}>
                        {error}
                    </Typography.Text>
                )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <List
                    size="large"
                    loading={loading}
                    dataSource={models}
                    renderItem={(name, idx) => (
                        <List.Item key={idx}>
                            <Button block>{name}</Button>
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
};

export default SidebarList;
