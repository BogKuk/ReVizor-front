import React from "react";
import { Card, Typography } from "antd";

const { Title } = Typography;

const MainPage = () => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: 20
        }}>
            <Title level={2}>Welcome to ReVizor MainPage!</Title>
            <p>Everything is working fine 😺</p>
            <Card
                style={{
                    marginTop: 20,
                    padding: 20,
                    borderRadius: 12,
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    textAlign: "center",
                    backgroundColor: "#1a1a1a"
                }}
            >
                <img
                    src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif"
                    alt="cute cat"
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                />
            </Card>
        </div>
    );
};

export default MainPage;
