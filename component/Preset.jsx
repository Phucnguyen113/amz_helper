import React, { useEffect, useState } from "react";
import { Button, Space, Select, Drawer, Form, Row, Col, Typography } from "antd";
import styled from "styled-components";
import { useAppContext } from "../utils/AppContext"; 
import { usePresetGrouped } from "../utils/hook";
import CopyButton from "./copyButton";
const { Text } = Typography;

const Preset = ({ isOpen, setOpen }) => {
    // const [isModalOpen, setIsModalOpen] = useState(false);
    const {preset, setPreset, messageApi, token, presetUsed, setPresetUsed} = useAppContext();
    const [trademarks, collections, customs, whitelist, blacklist, niches, ideas] = usePresetGrouped();
    const [idea, setIdea] = useState(presetUsed?.idea || null);
    const [niche, setNiche] = useState(presetUsed?.niche || null);
    const [nicheOptions, setNicheOptions] = useState([]);
    const [quotes, setQuotes] = useState([]);
  
    useEffect(() => {
      setIdea(presetUsed?.idea || null);
      setNiche(presetUsed?.niche || null);
    }, [presetUsed]);

    useEffect(() => {
      const newNiches = niches?.find(i => i.idea_id === idea)?.niches;
      setNicheOptions(newNiches || []);
    
      if (newNiches !== undefined && !newNiches.find(i => i.id === (form.getFieldValue('niche') || presetUsed?.niche))) {
        form.setFieldValue('niche', null);
        setQuotes([]);
      }
    }, [idea]);
  
    useEffect(() => {
      const newNiches = niches?.find(i => i.idea_id === idea)?.niches;
      setNicheOptions(newNiches || []);
    
      if (newNiches !== undefined && !newNiches.find(i => i.id === (form.getFieldValue('niche') || presetUsed?.niche))) {
        form.setFieldValue('niche', null);
      }
    }, [presetUsed, niches]);

    const fetchQuotes = async () => {
      const url = `https://evo.evolutee.net/api/quote?key=${encodeURIComponent(token)}&niche_id=${niche}`
      try {
        const quotes = await (await fetch(url)).json();
        console.log(quotes);
        setQuotes(quotes.data);
      } catch (error) {
        setQuotes([]);
      }
    }

    useEffect(() => {
      console.log('niche change', niche);
      if (niche) {
        fetchQuotes();
      }
    },[niche])
    const [form] = Form.useForm();

    const reloadPreset = () => {
        chrome.runtime.sendMessage({
            action: 'fetchPreset',
            key: token
        });
    }

    useEffect(() => {
      const updatePreset = function (msg, sender, sendResponse) {
          if (msg.action == 'fetchPresetDone') {
          if (!msg.status) {
              // setToken(null);
          } else {
              setPreset(msg.data);
          }
          }
      }
      chrome.runtime.onMessage.addListener(updatePreset);

      return () => {
          chrome.runtime.onMessage.removeListener(updatePreset);
      };
    }, []);

  const showModal = () => {
    if (token) {
      setOpen(true);
    }
  };
  const handleCancel = () => {
    setOpen(false);
  };

  const onFinish = (values) => {
    console.log("PPPRESET______:", values);
    messageApi.success("Your preset data saved!");

    setPresetUsed(values);
  };


  useEffect(() => {
    // form.setFieldsValue(preset);
    const check = Object.keys(presetUsed).length;
    if (!token) {
      return;
    }
    if (check < 5) {
        messageApi.open({
        type: "warning",
        key: "must_preset_set",
        content: (
          <>
            You must set preset before continue.
             <Button size="small" type="primary" onClick={() => showModal()}>
                open preset
            </Button>
          </>
        ),
        duration: 9999999999,
      });
    } else {
        messageApi.destroy("must_preset_set");
    }
  }, [presetUsed, token]);

  return (
    <Wrapper className="saph-toolbar">
      <Button type="primary" style={{padding: '12px 20px'}} onClick={showModal} size="small">
        Preset
      </Button>
      <Drawer
        title="Preset"
        open={isOpen}
        onClose={handleCancel}
        extra={
          <Space>
            <Button size="small" onClick={(e) => reloadPreset()}>Reload</Button>
            <Button size="small" type="primary" onClick={(e) => form.submit()}>
              Save
            </Button>
          </Space>
        }
      >
        <Form
            form={form}
            name="preset"
            layout="vertical"
            initialValues={presetUsed}
            onFinish={onFinish}
        >
          <Form.Item name={"_highlight"} label={"Highlight items newer than"}>
            <Select
              placeholder=""
              options={[
                ...[3, 6, 9, 12, 16].map((i) => {
                  return {
                    value: i,
                    label: `${i} months`,
                  };
                }),
                {
                  value: 24,
                  label: `2 years`,
                },
                {
                  value: 36,
                  label: `3 years`,
                },
              ]}
            />
          </Form.Item>

          <Row gutter={[15, 15]}>
            <Col span={12}>
              <Form.Item
                name={"trademark"}
                label={"Trademark"}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select
                  placeholder="Trademark"
                  allowClear
                  options={trademarks || []}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name={"collection"}
                label={"Collection"}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select
                  placeholder="Collection"
                  allowClear
                  options={collections || []}
                />
              </Form.Item>
            </Col>
            {/* <Col span={12}></Col> */}
          </Row>

          <Form.Item
            name={"custom"}
            label={"Custom"}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              placeholder="custom"
              // mode="multiple"
              maxCount={1}
              allowClear
              showSearch
              options={customs || []}
            />
          </Form.Item>

          <Form.Item
            name={"idea"}
            label={"Idea"}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              placeholder="Idea"
              // mode="multiple"
              maxCount={1}
              allowClear
              showSearch
              onChange={(value) => setIdea(value)}
              options={ideas || []}
            />
          </Form.Item>

          <Form.Item
            name={"niche"}
            label={"Niche"}
            showSearch
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              placeholder="Niche"
              // mode="multiple"
              onChange={(value) => setNiche(value)}
              maxCount={1}
              allowClear
              options={nicheOptions}
            />
          </Form.Item>
        </Form>
          {quotes?.map((quote, i) => <div key={i}> <Text copyable>{quote}</Text></div>)}
      </Drawer>
    </Wrapper>
  );
};

const Wrapper = styled.div``;
export default Preset;
