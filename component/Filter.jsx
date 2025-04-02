import React, { useEffect, useState } from "react";
import { Button, Space, Select, Drawer, Form, Row, Col, Input } from "antd";
import styled from "styled-components";
import { useAppContext } from "../utils/AppContext"; 
import { usePresetGrouped } from "../utils/hook";

const Filter = ({ isOpen, setOpen, form }) => {
    // const [isModalOpen, setIsModalOpen] = useState(false);
    const {filter, setFilter, setPreset, messageApi, token, presetUsed} = useAppContext();
    const [trademarks, collections, customs, whitelist, blacklist, niches, ideas] = usePresetGrouped();
    const [idea, setIdea] = useState(filter?.idea || null);
    const [niche, setNiche] = useState(filter?.niche || null);
    const [nicheOptions, setNicheOptions] = useState([]);

    useEffect(() => {
      setIdea(filter?.idea || null);
      setNiche(filter?.niche || null);
    }, [filter]);

    useEffect(() => {
      const newNiches = niches?.find(i => i.idea_id === idea)?.niches;
      setNicheOptions(newNiches || []);
    
      if (newNiches !== undefined && !newNiches.find(i => i.id === (form.getFieldValue('niche') || filter?.niche))) {
        form.setFieldValue('niche', null);
      }
    }, [idea]);
  
    useEffect(() => {
      const newNiches = niches?.find(i => i.idea_id === idea)?.niches;
      setNicheOptions(newNiches || []);
    
      if (newNiches !== undefined && !newNiches.find(i => i.id === (form.getFieldValue('niche') || filter?.niche))) {
        form.setFieldValue('niche', null);
      }
    }, [filter, niches]);

    const resetFilter = () => {
      const defaultSearch = {
        search: '',
        trademark: null,
        collection: null,
        custom: null,
        niche: null,
        idea: null
      }
      setFilter(defaultSearch);
      form.setFieldsValue(defaultSearch);
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
    setOpen(true);
  };
  const handleCancel = () => {
    setOpen(false);
  };

  const onFinish = (values) => {
    console.log("Filter:", values);
    messageApi.success("Filter updated!");

    setFilter(values);
    form.setFieldsValue(values);
  };

  return (
    <Wrapper className="saph-toolbar">
      <Button type="primary" style={{padding: '12px 20px'}} onClick={showModal} size="small">
        Filter
      </Button>
      <Drawer
        title="Filter"
        open={isOpen}
        onClose={handleCancel}
        extra={
          <Space>
            <Button size="small" onClick={(e) => resetFilter()}>Clear</Button>
            <Button size="small" type="primary" onClick={(e) => form.submit()}>
              Apply Filter
            </Button>
          </Space>
        }
      >
        <Form
            form={form}
            name="filter"
            layout="vertical"
            initialValues={filter}
            onFinish={onFinish}
        >
          <Form.Item name={"search"} label={"Search"}>
            <Input type="string" name="search" placeholder="search..."></Input>
          </Form.Item>

          <Row gutter={[15, 15]}>
            <Col span={12}>
              <Form.Item
                name={"trademark"}
                label={"Trademark"}
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
          >
            <Select
              placeholder="custom"
              // mode="multiple"
              maxCount={1}
              allowClear
              options={customs || []}
            />
          </Form.Item>

          <Form.Item
            name={"idea"}
            label={"Idea"}
          >
            <Select
              placeholder="Idea"
              // mode="multiple"
              maxCount={1}
              allowClear
              onChange={(value) => setIdea(value)}
              options={ideas || []}
            />
          </Form.Item>

          <Form.Item
            name={"niche"}
            label={"Niche"}
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
      </Drawer>
    </Wrapper>
  );
};

const Wrapper = styled.div``;
export default Filter;
