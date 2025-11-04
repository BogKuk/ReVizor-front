import React from 'react';
import {KeyOutlined, UserOutlined} from '@ant-design/icons';
import {Button, Card, Input, Space, Typography} from 'antd';

const { Title } = Typography;

const AuthorizationCard = () => {
    return (
        <Card title={
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
                />
                <Input.Password
                    placeholder="Password"
                    prefix = {<KeyOutlined style={{ color: 'rgba(0,0,0,.25)' }}/>}
                    size="large"
                />
                <Button type="primary" size="large" block>Sign In</Button>
            </Space>
        </Card>
    );
};
export default AuthorizationCard;
