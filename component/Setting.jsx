import React, { useState, useEffect } from "react";

import { SettingOutlined } from "@ant-design/icons";
import { Button, Space, Tag, Drawer, Form } from "antd";
import styled from "styled-components";
import { useAppContext } from "../utils/AppContext";
import TokenSettings from "./TokenSettings";

const Settings = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // const [serverData, loadServerData] = useAppServerData();
    const { token, setToken } = useAppContext();
    const [inputText, setInputText] = useState("");
    const { preset, setPreset } = useAppContext();

    const reloadPreset = () => {
        chrome.runtime.sendMessage({
            action: 'fetchPreset',
            key: token
        });
    }

    useEffect(() => {
        chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
            if (msg.action == 'fetchPresetDone') {
            if (!msg.status) {
                // setToken(null);
            } else {
                setPreset(msg.data);
            }
            }
        });
    }, []);

    useEffect(() => {
        setInputText(token);
    }, [token]);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <Wrapper className="saph-toolbar">
            <Button icon={<SettingOutlined />} onClick={showModal} />

            <Drawer
            title="Settings"
            open={isModalOpen}
            zIndex={10100}
            onClose={handleCancel}
            extra={
                <Space>
                    <Button onClick={() => reloadPreset()}>Reload</Button>
                </Space>
            }
            >
            <Form layout="vertical">
                <Form.Item label={"API Key"}>
                <TokenSettings />
                </Form.Item>

                <Form.Item label={"Blacklist"}>
                <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                    {preset?.[0]?.blacklist?.length ? (
                    <>
                        {preset?.[0]?.blacklist?.map((w) => (
                        <Tag color="#f50" key={w}>{w}</Tag>
                        ))}
                    </>
                    ) : null}
                </div>
                </Form.Item>
                
                <Form.Item label={"Whitelist"}>
                <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                    {preset?.[0]?.whitelist?.length ? (
                    <>
                        {preset?.[0]?.whitelist.map((w) => (
                        <Tag color="#87d068" key={w}>{w}</Tag>
                        ))}
                    </>
                    ) : null}
                </div>
                </Form.Item>
                
                
            </Form>
            </Drawer>
        </Wrapper>
    );
};
const Wrapper = styled.div``;
export default Settings;
