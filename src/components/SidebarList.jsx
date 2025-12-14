import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Button, List, Typography, message } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

const SidebarList = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();
    const [idsByName, setIdsByName] = useState({});

    const { accessToken, logout } = useContext(AuthContext);

    const fetchModels = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:8000/analysis/models/names', {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            setModels(Array.isArray(response.data) ? response.data : []);
            const names = Array.isArray(response.data) ? response.data : [];
            const map = {};
            let id = 1;
            let found = 0;
            const maxTries = names.length * 10;
            while (found < names.length && id <= maxTries) {
                try {
                    const r = await axios.get(`http://127.0.0.1:8000/analysis/models/${id}/url`, {
                        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                    });
                    const name = r.data?.name;
                    if (name && names.includes(name) && !map[name]) {
                        map[name] = id;
                        found += 1;
                    }
                } catch { void 0; }
                id += 1;
            }
            setIdsByName(map);
        } catch {
            messageApi.open({ type: 'error', content: 'Не удалось загрузить модели' });
        } finally {
            setLoading(false);
        }
    }, [accessToken, messageApi]);

    const openModel = (name) => {
        const id = idsByName[name];
        if (!id) {
            messageApi.open({ type: 'warning', content: 'Модель недоступна' });
            return;
        }
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
            {contextHolder}
            <div style={{ padding: 12, borderBottom: '1px solid #e0e0e0' }}>
                <Button type="primary" icon={<PlusCircleOutlined />} block>
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
                            <Button block onClick={() => openModel(name)}>{name}</Button>
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
