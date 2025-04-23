import { Image, Select, Table, Popconfirm, Space, Button, Form, Spin, Radio } from "antd";
import React, { useState, useEffect } from "react";
import { usePresetGrouped } from "./utils/hook";
import { SyncOutlined, InfoOutlined, CheckOutlined } from "@ant-design/icons";
import { SelectColumn } from "./component/SelectColumn";
import { createStyles } from 'antd-style';
import styled from "styled-components";
import { useAppContext } from "./utils/AppContext";
import Filter from "./component/Filter";

import './table.css';

const useStyle = createStyles(({ css, token }) => {
const { antCls } = token;
return {
  customTable: css`
    ${antCls}-table {
      ${antCls}-table-container {
        ${antCls}-table-body,
        ${antCls}-table-content {
          scrollbar-width: thin;
          scrollbar-color: #eaeaea transparent;
          scrollbar-gutter: stable;
        }
      }
    }
  `,
};
});
const Wrapper = styled.div`
  .saph-tt {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1em;
  }
`;

function SpinTable({dataSource, hightlightPinType, setItemsSelected, reloadPins}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeKey, setActiveKey] = useState('1');
  const {pins, setPins, token, setToken, preset, presetUsed, filter, setFilter, setSelectedPins, syncPins} = useAppContext();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState(pins || []);
  const [niche, setNiche] = useState(presetUsed?.niche || null);
  const [paging, setPaging] = useState({
    pageSize: 20,
    current: 1,
  });

  const reFilterIfTabChange = (newActiveKey) => {
    if (newActiveKey == 1) {
      // all type pins
      setData(pins);
    }

    if (newActiveKey == 2) {
      // ok type pins
      const newPins = [...pins].filter(pin => {
        if (hightlightPinType(pin) === 'ok') {
          return true;
        }
      });
      setData(newPins);
    }

    if (newActiveKey == 3) {
      // ok type pins
      const newPins = [...pins].filter(pin => {
        if (hightlightPinType(pin) === 'warning') {
          return true;
        }
      });
      setData(newPins);
    }

    if (newActiveKey == 4) {
      // ok type pins
      const newPins = [...pins].filter(pin => {
        if (hightlightPinType(pin) === 'error') {
          return true;
        }
      });
      setData(newPins);
    }
  }

  const onChangeTab = ({ target: { value } })  => {
    setActiveKey(value);
    reFilterIfTabChange(value);
  };


  useEffect(() => {
    const filterdata = () => {
      let tempData = [...pins];

      if (activeKey == 2) {
        // ok type pins
        tempData = [...pins].filter(pin => {
          if (hightlightPinType(pin) === 'ok') {
            return true;
          }
        });
      }

      if (activeKey == 3) {
        // ok type pins
        tempData = [...pins].filter(pin => {
          if (hightlightPinType(pin) === 'warning') {
            return true;
          }
        });
      }

      if (activeKey == 4) {
        // ok type pins
        tempData = [...pins].filter(pin => {
          if (hightlightPinType(pin) === 'error') {
            return true;
          }
        });
      }

      Object.keys(filter).forEach(i => {
        if (filter[i] && i === 'search') {
          tempData = tempData.filter(temp => {
            return temp?.['title']?.toLowerCase().includes(filter[i]?.toLowerCase());
          });
  
        } else if (filter[i]) {
          tempData = tempData.filter(temp => {
            return temp?.[i] == filter[i]
          });
        }
      });
      console.log('after search', tempData);
      setData(tempData);
    }
    filterdata();
  }, [filter, pins]);

  useEffect( () => {
    setSelectedPins(selectedRowKeys);
  }, [selectedRowKeys])

  const changePresetPropPin = (pinId, prop, value) => {
    console.log('changeTrademarkPin: pinId', pinId);

    setPins([...pins?.map(i => {
      if (i.id === pinId) {
        i[prop] = value;
      }
      return i;
    })]);
  }

  const onSelectChange = newSelectedRowKeys => {
    console.log('selectedRowKeys changed: ', newSelectedRowKeys);
    setItemsSelected(newSelectedRowKeys.length);
    
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const deletePins = (pinIds) => {
    const newPins = pins.filter((pin) => !pinIds.includes(pin.id));
    setPins(newPins);
    onSelectChange([]);
  }

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
    filterForm.setFieldsValue(defaultSearch);
  }

  const [trademarks, collections, customs, whitelist, blacklist, niches, ideas] = usePresetGrouped();

  const columns = [
      {
        title: 'Image',
        dataIndex: 'image',
        key: 'image',
        fixed: true,
        render: (_, row) => {
          const hl = hightlightPinType(row);
          return (
            <>
              <Image  style={{width: 80}} src={_} preview={false} className={hl ? `${hl}-image` : ''}/>
            </>
          )
        }
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        fixed: true,
        width: 350,
        render: (text, row) => {
          // let style = {};
          const hl = hightlightPinType(row);
          // if (hl) {
          //   style.color = "#e90003";
          // }
    
          let date = row?.createdDate ? row?.createdDate.split("T")[0] : "-";
          return (
            <div className={hl ? `${hl}-title` : ''}>
              <a target="_blank" href={`https://www.pinterest.com/pin/${row.id}/`}>
                <strong className={hl ? `${hl}-title` : ''}>{text || "(Untitled)"}</strong>
              </a>
              <div>
                <i>#{row.id}</i>
              </div>
              <div>
                <span title="Date added">{date}</span>
              </div>
              <div className="table-stats">
                <div title="domain">
                  <i className="saic-domain"></i> {row?.domain || ""}
                </div>
                <div className="saph-sffil">
                  <span title="saved count">
                    <i className="saic-saved"></i> {row?.saved || 0}
                  </span>
                  |
                  <span title="repin count">
                    <i className="saic-repin"></i> {row?.repin || 0}
                  </span>
                </div>
              </div>
    
              {row?.keyword ? <div>Keyword: {row?.keyword}</div> : null}
              {row?.relatedKeyword ? (
                <div>Related: {row?.relatedKeyword}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: "Idea",
        dataIndex: "idea",
        key: "idea",
        width: 180,
        render: (_, row) => {
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'idea', value)}  allowClear options={ideas || []} defaultValue={_} />;
        },
      },
      {
        title: "Niche",
        dataIndex: "niche",
        key: "niche",
        width: 180,
        render: (_, row) => {
          const newNiches = niches?.find(i => i.idea_id === row.idea)?.niches;
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'niche', value)} allowClear options={newNiches || []} value={newNiches?.find(i => i.id === _) ? _ : null} />;
        },
      },
      {
        title: "Trademark",
        dataIndex: "trademark",
        key: "trademark",
        width: 120,
        render: (_, row) => {
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'trademark', value)} allowClear options={trademarks || []} defaultValue={_}></SelectColumn>
        },
      },
      {
        title: "Collection",
        dataIndex: "collection",
        key: "collection",
        width: 120,
        render: (_, row) => {
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'collection', value)} allowClear options={collections || []} defaultValue={_}></SelectColumn>
        },
      },
      {
        title: "Custom",
        dataIndex: "custom",
        key: "custom",
        width: 180,
        render: (_, row) => {
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'custom', value)} allowClear options={customs || []} defaultValue={_}></SelectColumn>;
        },
      },
      {
        title: "User",
        key: "user",
        width: 120,
        render: (_, row) => {
          return (
            <>
              {row?.full_name}
              <br />
              <i>
                <small>{row?.username}</small>
              </i>
            </>
          );
        },
      },
      {
        title: "",
        dataIndex: "sync",
        key: "sync",
        width: 40,
        align: "center",
        fixed: "right",
        render: (_, row) => {
          const isLoading = row?.sync_status === "syncing" ? true : false;
          let bg = "#fff";
          let color = "#333";
          let icon = <SyncOutlined />;
          if ("error" === row?.sync_status) {
            bg = "red";
            color = "#fff";
            icon = <InfoOutlined />;
          }

          if ("synced" === row?.sync_status) {
            bg = "green";
            color = "#fff";
            icon = <CheckOutlined />;
          }

          return (
            <Button
              loading={isLoading}
              size="small"
              style={{ background: bg, color }}
              icon={icon}
            />
          );
        },
      },
  ];

  const { styles } = useStyle();
  const [filterForm] = Form.useForm();

  const initialItems = [
    { label: 'AllType', value: '1' },
    { label: 'Ok', value: '2' },
    { label: 'Warning', value: '3' },
    { label: 'Blacklist', value: '4' }
  ];

  return (
    <Wrapper>
       {loading && <div className="overlay"><Spin size="large" /></div>}
      <Space style={{display:'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={syncPins}
            disabled={!selectedRowKeys.length}
          >
            Sync
          </Button>
          <Popconfirm
            title="Delete!"
            description="Are you sure to delete selected items?"
            onConfirm={() => deletePins(selectedRowKeys)}
            onCancel={() => { }}
            okText="Yes"
            cancelText="No"
          >
            <Button  size="small" type="primary" danger disabled={!selectedRowKeys.length}>
              Delete
            </Button>
          </Popconfirm>

          <Button
            size="small"
            onClick={async () => {
              setLoading(true);
              await reloadPins(selectedRowKeys);
              setTimeout(() => {
                setLoading(false);
              }, 500);
              
            }}
            loading={loading} 
            disabled={!selectedRowKeys.length || loading } //|| reloading
          >
            Reload
          </Button>

          {/* <Tabs
            type="card"
            size="small"
            onChange={onChangeTab}
            activeKey={activeKey}
            // onEdit={onEdit}
            items={initialItems}
          /> */}
          <Radio.Group
            size="small"
            options={initialItems}
            onChange={onChangeTab}
            value={activeKey}
            optionType="button"
            buttonStyle="solid"
          />
        </Space>
        <Space >
          <Button size="small" disabled={!Object.values(filter).some(value => value !== undefined && value !== null && value !== '')} onClick={(e) => resetFilter()}>Clear</Button>
          <Filter setOpen={setFilterOpen} isOpen={filterOpen} form={filterForm}></Filter>
        </Space>
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data.map(i => { return {...i, key: i.id}}).reverse()}
        className={styles.customTable}
        scroll={{ x: 'max-content' }}
        pagination={{
          position: ["bottomCenter"],
          total: data?.length || 0,
          showTotal: (total) => `${total} Items`,
          onChange: (page, pageSize) => {
            console.log('change', page)
            setPaging({
              current: page,
              pageSize,
            });
          },
          ...paging
        }}
      />
    </Wrapper>
  );
}

export default SpinTable;