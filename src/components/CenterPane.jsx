import React, { useContext, useState } from 'react';
import { LaptopOutlined, NotificationOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';
import { Layout, Menu, theme, Upload, message, Typography } from 'antd';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import ModelViewer from './ModelViewer.jsx';
const { Header, Content, Sider } = Layout;
const items1 = ['1', '2', '3'].map(key => ({
    key,
    label: `nav ${key}`,
}));
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
    const [modelUrl, setModelUrl] = useState(null);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const { Dragger } = Upload;
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
                    } catch {
                        message.error('Model unavailable');
                    }
                }
                onSuccess('ok');
                message.success('Файл загружен');
                window.dispatchEvent(new Event('models-updated'));
            } catch (err) {
                message.error('Ошибка загрузки файла');
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
            <Header style={{ display: 'flex', alignItems: 'center' }}>
                <div className="demo-logo" />
                <Menu
                    theme="dark"
                    mode="horizontal"
                    defaultSelectedKeys={['2']}
                    items={items1}
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
                        {modelUrl ? (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <ModelViewer
                                    url={modelUrl}
                                    width={'100%'}
                                    height={600}
                                    autoFrame
                                    onError={() => {
                                        message.error('Model cant be loaded');
                                        setModelUrl(null);
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
                        )}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
        </div>
    );
};
export default CenterPane;
