import React, { useContext, useEffect, useState } from 'react';
import { LaptopOutlined, NotificationOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';
import { Layout, Menu, theme, Upload, message, Typography } from 'antd';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import ModelViewer from './ModelViewer.jsx';
const { Header, Content, Sider } = Layout;
const headerItems = [
    { key: 'model', label: 'Model' },
    { key: 'report', label: 'Report' },
];
const items2 = [UserOutlined, LaptopOutlined, NotificationOutlined].map((icon, index) => {
    const key = String(index + 1);
    return {
        key: `sub${key}`,
        icon: React.createElement(icon),
        label: `subnav ${key}`,
        children: Array.from({ length: 4 }).map((_, j) => {
            const subKey = index * 4 + j + 1;
            return {
                key: subKey,
                label: `option${subKey}`,
            };
        }),
    };
});
const CenterPane = () => {
    const { accessToken } = useContext(AuthContext);
    const [modelUrl, setModelUrl] = useState(() => localStorage.getItem('lastModelUrl') || null);
    const [messageApi, contextHolder] = message.useMessage();
    const [selectedModelId, setSelectedModelId] = useState(null);
    const [reportText, setReportText] = useState('No analysis yet');
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const { Dragger } = Upload;
    const [activeTab, setActiveTab] = useState('model');
    useEffect(() => {
        const stored = localStorage.getItem('lastModelUrl');
        if (stored) {
            axios.head(stored)
                .then(() => setModelUrl(stored))
                .catch(() => {
                    localStorage.removeItem('lastModelUrl');
                    setModelUrl(null);
                });
        }
    }, []);
    useEffect(() => {
        if (modelUrl) {
            localStorage.setItem('lastModelUrl', modelUrl);
        } else {
            localStorage.removeItem('lastModelUrl');
        }
    }, [modelUrl]);
    useEffect(() => {
        const handler = async (e) => {
            const { id } = e.detail || {};
            if (!id) return;
            setSelectedModelId(id);
            try {
                const r = await axios.get(`http://127.0.0.1:8000/analysis/models/${id}/url`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                });
                const rel = r.data?.url;
                if (rel) {
                    const full = `http://127.0.0.1:8000${rel}`;
                    await axios.head(full);
                    setModelUrl(full);
                    localStorage.setItem('lastModelUrl', full);
                    setActiveTab('model');
                }
            } catch {
                messageApi.open({ type: 'error', content: 'Не удалось открыть модель' });
            }
        };
        window.addEventListener('open-model', handler);
        const reset = () => {
            setSelectedModelId(null);
            setModelUrl(null);
            localStorage.removeItem('lastModelUrl');
            setReportText('No analysis yet');
            setActiveTab('model');
        };
        window.addEventListener('new-analysis', reset);
        return () => {
            window.removeEventListener('open-model', handler);
            window.removeEventListener('new-analysis', reset);
        };
    }, [accessToken, messageApi]);
    useEffect(() => {
        if (activeTab !== 'report' || !selectedModelId) return;
        (async () => {
            try {
                const r = await axios.get(`http://127.0.0.1:8000/analysis/models/${selectedModelId}/analysis`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                });
                const data = r.data;
                if (data && typeof data === 'object' && 'message' in data && data.message === 'no analysis yet') {
                    setReportText('No analysis yet');
                } else {
                    setReportText(JSON.stringify(data));
                }
            } catch {
                messageApi.open({ type: 'error', content: 'Не удалось получить отчёт' });
            }
        })();
    }, [activeTab, selectedModelId, accessToken, messageApi]);
    const uploadProps = {
        accept: '.obj,.fbx,.glb,.gltf',
        multiple: false,
        customRequest: async ({ file, onSuccess, onError }) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await axios.post('http://127.0.0.1:8000/upload/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                });
                const relUrl = response.data?.url;
                if (relUrl) {
                    const fullUrl = `http://127.0.0.1:8000${relUrl}`;
                    try {
                        await axios.head(fullUrl);
                        setModelUrl(fullUrl);
                        localStorage.setItem('lastModelUrl', fullUrl);
                    } catch {
                        messageApi.open({ type: 'error', content: 'Model unavailable' });
                    }
                }
                onSuccess('ok');
                messageApi.open({ type: 'success', content: 'Файл загружен' });
                window.dispatchEvent(new Event('models-updated'));
            } catch (err) {
                messageApi.open({ type: 'error', content: 'Ошибка загрузки файла' });
                onError(err);
            }
        },
    };
    return (
        <div
            style={{
                position: 'fixed',
                left: 344,
                top: 12,
                right: 12,
                bottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto'
            }}
        >
        <Layout style={{ width: '100%'}}>
            {contextHolder}
            <Header style={{ display: 'flex', alignItems: 'center' }}>
                <div className="demo-logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[activeTab]}
                    onClick={({ key }) => setActiveTab(key)}
                    items={headerItems}
                    style={{ flex: 1, minWidth: 0 }}
                />
            </Header>
            <Layout>
                <Sider width={200} style={{ background: colorBgContainer }}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['1']}
                        defaultOpenKeys={['sub1']}
                        style={{ height: '100%', borderInlineEnd: 0 }}
                        items={items2}
                    />
                </Sider>
                <Layout style={{ padding: '0 24px 24px' }}>
                    <Content
                        style={{
                            padding: 24,
                            margin: 0,
                            minHeight: 280,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        {activeTab === 'model' ? (
                            modelUrl ? (
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <ModelViewer
                                        url={modelUrl}
                                        width={'100%'}
                                        height={600}
                                        autoFrame
                                    onError={() => {
                                        messageApi.open({ type: 'error', content: 'Model cant be loaded' });
        						setModelUrl(null);
                                        localStorage.removeItem('lastModelUrl');
                                    }}
                                    />
                                </div>
                            ) : (
                                <Dragger {...uploadProps} style={{ padding: 24 }}>
                                    <p className="ant-upload-drag-icon">
                                        <UploadOutlined />
                                    </p>
                                    <Typography.Text>Drag and drop a file here or click to select</Typography.Text>
                                    <br />
                                    <Typography.Text type="secondary">Accepted formats: .obj, .fbx, .glb, .gltf</Typography.Text>
                                </Dragger>
                            )
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography.Text>{reportText}</Typography.Text>
                            </div>
                        )}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
        </div>
    );
};
export default CenterPane;
