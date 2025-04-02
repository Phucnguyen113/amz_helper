import React, { useState, useEffect } from "react";

import { Button, Space, Input } from "antd";
import { useAppContext } from "../utils/AppContext";

const TokenSettings = () => {
  const { token, setToken, setPreset } = useAppContext();
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    setInputText(token);
  }, []);

  const handleSetNewToken = () => {
    setToken(inputText);
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'fetchPreset',
        key: inputText
      });
    }, 600);
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
      if (msg.action == 'fetchPresetDone') {
        if (!msg.status) {
          setToken(null);
        } else {
          setPreset(msg.data);
        }
      }
    });
  }, []);

  return (
    // <Wrapper className="saph-toolbar">
      <Space.Compact block>
        <Input
          type="text"
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Your api key"
          value={inputText}
        />
        <Button onClick={() => handleSetNewToken()} type="primary">
          Save
        </Button>
      </Space.Compact>
    // </Wrapper>
  );
};

// const Wrapper = styled.div``;
export default TokenSettings;
