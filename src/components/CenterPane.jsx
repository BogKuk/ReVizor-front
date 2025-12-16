import React, { useContext, useEffect, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Layout, Menu, theme, Upload, message, Typography, Select, Button, Card, Descriptions, Statistic, Tag, Divider, Space } from 'antd';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import ModelViewer from './ModelViewer.jsx';
const { Header, Content, Sider } = Layout;
const headerItems = [
    { key: 'model', label: 'Model' },
    { key: 'report', label: 'Report' },
];
const CenterPane = () => {
    const { accessToken } = useContext(AuthContext);
    const [modelUrl, setModelUrl] = useState(() => localStorage.getItem('lastModelUrl') || null);
    const [messageApi, contextHolder] = message.useMessage();
    const [selectedModelId, setSelectedModelId] = useState(null);
    const [reportText, setReportText] = useState('No analysis yet');
    const [reportData, setReportData] = useState(null);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const { Dragger } = Upload;
    const [activeTab, setActiveTab] = useState('model');
    const ANALYSIS_OPTIONS = {
        gameTypes: ['low-poly', 'indie', 'aa', 'aaa', 'cinematic'],
        usageByType: {
            'low-poly': ['background', 'prop', 'hero'],
            indie: ['background', 'prop', 'hero'],
            aa: ['background', 'prop', 'hero'],
            aaa: ['background', 'prop', 'hero'],
            cinematic: ['background', 'prop', 'hero'],
        },
    };
    const [analysisParams, setAnalysisParams] = useState({
        game_type: ANALYSIS_OPTIONS.gameTypes[1],
        usage_area: ANALYSIS_OPTIONS.usageByType[ANALYSIS_OPTIONS.gameTypes[1]][1],
    });
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
            setReportData(null);
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
                    setReportData(null);
                } else {
                    setReportData(data);
                }
            } catch {
                messageApi.open({ type: 'error', content: 'Не удалось получить отчёт' });
            }
        })();
    }, [activeTab, selectedModelId, accessToken, messageApi]);
    const runAnalysis = async () => {
        if (!selectedModelId) return;
        try {
            const r = await axios.post(`http://127.0.0.1:8000/analysis/models/${selectedModelId}/analyze`, analysisParams, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
            setReportData(r.data);
            messageApi.open({ type: 'success', content: 'Анализ выполнен' });
        } catch {
            messageApi.open({ type: 'error', content: 'Не удалось выполнить анализ' });
        }
    };
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
                <Sider width={260} style={{ background: colorBgContainer }}>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Typography.Text strong>Тип игры</Typography.Text>
                        <Select
                            value={analysisParams.game_type}
                            onChange={(v) => {
                                const usageList = ANALYSIS_OPTIONS.usageByType[v] || [];
                                const nextUsage = usageList.includes(analysisParams.usage_area) ? analysisParams.usage_area : usageList[0];
                                setAnalysisParams({ game_type: v, usage_area: nextUsage });
                            }}
                            options={ANALYSIS_OPTIONS.gameTypes.map(g => ({ value: g, label: g }))}
                        />
                        <Typography.Text strong>Область применения</Typography.Text>
                        <Select
                            value={analysisParams.usage_area}
                            onChange={(v) => setAnalysisParams(p => ({ ...p, usage_area: v }))}
                            options={(ANALYSIS_OPTIONS.usageByType[analysisParams.game_type] || []).map(u => ({ value: u, label: u }))}
                        />
                        <Button type="primary" block disabled={!selectedModelId} onClick={runAnalysis}>
                            Запустить анализ
                        </Button>
                    </div>
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
                                {reportData ? (
                                    <div style={{ width: 720 }}>
                                        <Card title="Результат анализа" bordered style={{ marginBottom: 16 }}>
                                            <Space size="large">
                                                <Statistic title="Полигонов" value={reportData?.metrics?.faces ?? 0} />
                                                <Statistic title="Плотность" value={reportData?.metrics?.density ?? 0} precision={2} />
                                            </Space>
                                            <Divider />
                                            <Space size="large">
                                                <Space>
                                                    <Typography.Text>Количество полигонов</Typography.Text>
                                                    <Tag color={reportData?.result?.faces_ok ? 'green' : 'red'}>
                                                        {reportData?.result?.faces_ok ? 'OK' : 'Превышение'}
                                                    </Tag>
                                                </Space>
                                                <Space>
                                                    <Typography.Text>Плотность полигонов</Typography.Text>
                                                    <Tag color={reportData?.result?.density_ok ? 'green' : 'red'}>
                                                        {reportData?.result?.density_ok ? 'OK' : 'Превышение'}
                                                    </Tag>
                                                </Space>
                                            </Space>
                                        </Card>
                                        <Card title="Параметры" bordered style={{ marginBottom: 16 }}>
                                            <Descriptions column={2}>
                                                <Descriptions.Item label="Тип игры">{reportData?.params?.game_type}</Descriptions.Item>
                                                <Descriptions.Item label="Область применения">{reportData?.params?.usage_area}</Descriptions.Item>
                                            </Descriptions>
                                        </Card>
                                        <Card title="Границы" bordered>
                                            <Descriptions column={2}>
                                                <Descriptions.Item label="Макс. полигонов">{reportData?.limits?.max_faces}</Descriptions.Item>
                                                <Descriptions.Item label="Макс. плотность">{reportData?.limits?.max_density}</Descriptions.Item>
                                            </Descriptions>
                                        </Card>
                                    </div>
                                ) : (
                                    <Typography.Text>{reportText}</Typography.Text>
                                )}
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
