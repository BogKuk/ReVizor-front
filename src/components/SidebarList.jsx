import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Button, List, Typography, message, Popconfirm } from 'antd';
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

const SidebarList = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [show, setShow] = useState(false);

    const { accessToken, logout } = useContext(AuthContext);

    const fetchModels = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:8000/analysis/models/names', {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            setModels(Array.isArray(response.data) ? response.data : []);
        } catch {
            messageApi.open({ type: 'error', content: 'Не удалось загрузить модели' });
        } finally {
            setLoading(false);
        }
    }, [accessToken, messageApi]);

    const deleteModel = async (id) => {
        try {
            await axios.delete(`http://127.0.0.1:8000/upload/${id}`, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            setModels(prev => prev.filter(n => n.id !== id));
            messageApi.open({ type: 'success', content: 'Модель удалена' });
            window.dispatchEvent(new Event('models-updated'));
            window.dispatchEvent(new Event('new-analysis'));
        } catch {
            messageApi.open({ type: 'error', content: 'Не удалось удалить модель' });
        }
    };

    const openModel = (id) => {
        window.dispatchEvent(new CustomEvent('open-model', { detail: { id } }));
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
    }, [accessToken, fetchModels]);
    useEffect(() => {
        const t = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={`fade-slide-up ${show ? 'show' : ''}`}
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
            {contextHolder}
            <div style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    block
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('new-analysis'));
                    }}
                >
                    Add analysis
                </Button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <List
                    size="large"
                    loading={loading}
                    dataSource={models}
                    renderItem={(name, idx) => (
                        <List.Item key={idx}>
                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                <Button style={{ flex: 1 }} onClick={() => openModel(name.id)}>{name.name}</Button>
                                <Popconfirm
                                    title="Удалить модель?"
                                    okText="Да"
                                    cancelText="Нет"
                                    onConfirm={() => deleteModel(name.id)}
                                >
                                    <Button danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </div>
                        </List.Item>
                    )}
                />
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #e0e0e0' }}>
                <Button danger block onClick={logout}>
                    Logout
                </Button>
            </div>
        </div>
    );
};

export default SidebarList;
