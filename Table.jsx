import { Image, Select, Table, Popconfirm, Space, Button, Form, Spin, Radio } from "antd";
import React, { useState, useEffect, useMemo } from "react";
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
  const {pins, setPins, token, setToken, preset, presetUsed, filter, setFilter, setSelectedPins, syncPins, syncing} = useAppContext();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState(pins || []);
  const [niche, setNiche] = useState(presetUsed?.niche || null);
  const [paging, setPaging] = useState({
    pageSize: 20,
    current: 1,
  });

  const [scrollY, setScrollY] = useState(window.innerHeight - 250);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      setSelectedRowKeys([]);
      setItemsSelected(0);
    };

    const handleResize = () => {
      setScrollY(window.innerHeight - 250);
    };

    const syncPinListener = function (msg, sender, sendResponse) {
      if (msg.action == 'savePinsDone') {
        setSelectedRowKeys([]);
        setItemsSelected(0);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    chrome.runtime.onMessage.addListener(syncPinListener);

    return () =>  {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      chrome.runtime.onMessage.removeListener(syncPinListener);
    }
  }, []);

  const onChangeTab = ({ target: { value } })  => {
    setActiveKey(value);
  };

  const filteredData = useMemo(() => {
    let tempData = [...pins];
  
    if (activeKey == 2) {
      tempData = pins.filter(pin => {
        const {typeHightlight} = hightlightPinType(pin);
        return  typeHightlight === 'ok' || typeHightlight === 'whitelist';
      });
    } else if (activeKey == 3) {
      tempData = pins.filter(pin => {
        const {typeHightlight} = hightlightPinType(pin);
        return typeHightlight === 'warning';
      });
    } else if (activeKey == 4) {
      tempData = pins.filter(pin => {
        const {typeHightlight} = hightlightPinType(pin);
        return typeHightlight === 'error';
      });
    } else if (activeKey == 5) {
      tempData = pins.filter(pin => pin?.sync_status == 'error');
    } else if (activeKey == 6) {
      tempData = pins.filter(pin => pin?.sync_status == 'exist');
    }

    Object.keys(filter).forEach(i => {
      if (filter[i] && i === 'search') {
        tempData = tempData.filter(temp =>
          temp?.title?.toLowerCase().includes(filter[i].toLowerCase())
        );
      } else if (filter[i]) {
        tempData = tempData.filter(temp => temp?.[i] == filter[i]);
      }
    });

    console.log('after search', tempData);
    return tempData;
  }, [pins, filter, activeKey]);

  // useEffect(() => {
  //   const filterdata = () => {
  //     let tempData = [...pins];

  //     if (activeKey == 2) {
  //       // ok type pins
  //       tempData = [...pins].filter(pin => {
  //         if (hightlightPinType(pin) === 'ok') {
  //           return true;
  //         }
  //       });
  //     }

  //     if (activeKey == 3) {
  //       // ok type pins
  //       tempData = [...pins].filter(pin => {
  //         if (hightlightPinType(pin) === 'warning') {
  //           return true;
  //         }
  //       });
  //     }

  //     if (activeKey == 4) {
  //       // ok type pins
  //       tempData = [...pins].filter(pin => {
  //         if (hightlightPinType(pin) === 'error') {
  //           return true;
  //         }
  //       });
  //     }

  //     Object.keys(filter).forEach(i => {
  //       if (filter[i] && i === 'search') {
  //         tempData = tempData.filter(temp => {
  //           return temp?.['title']?.toLowerCase().includes(filter[i]?.toLowerCase());
  //         });
  
  //       } else if (filter[i]) {
  //         tempData = tempData.filter(temp => {
  //           return temp?.[i] == filter[i]
  //         });
  //       }
  //     });
  //     console.log('after search', tempData);
  //     setData(tempData);
  //   }
  //   filterdata();
  // }, [filter, pins]);

  useEffect(() => {
    setData(filteredData);
  }, [filteredData]);

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
    columnWidth: 48
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
        width: 200,
        render: (_, row) => {
          const {typeHightlight} = hightlightPinType(row);
          return (
            <>
              <Image style={{width: 200}} src={row?.images?.[0]} preview={false} className={typeHightlight ? `${typeHightlight}-image` : ''}/>
            </>
          )
        }
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        fixed: true,
        width: 300,
        render: (text, row) => {
          // let style = {};
          const {typeHightlight} = hightlightPinType(row);
          // if (hl) {
          //   style.color = "#e90003";
          // }
    
          let date = row?.listedDate || "-";
          return (
            <div className={typeHightlight ? `${typeHightlight}-title` : ''}>
              <a target="_blank" href={`${row?.url}`} className="title-spin">
                <strong className={typeHightlight ? `${typeHightlight}-title` : ''}>{text || "(Untitled)"}</strong>
              </a>
              <div>
                <i>#{row.id}</i>
              </div>
              <div>
                <span title="Date added">{date}</span>
              </div>
              <div className="table-stats">
                <div title="shop">
                  <i className="saic-domain"></i> {row?.shopName || ""}
                </div>
                <div className="saph-sffil">
                  <span title="views count">
                    <i className="fa fa-eye"></i> {row?.reviews || 0}
                  </span>
                </div>
                <div className="saph-sffil">
                  <span title="month sales count">
                    <i className="fas fa-shopping-cart"></i> {row?.sales30 || 0}
                  </span>
                  {/* |
                  <span title="total sales count">
                    <i className="fas fa-shopping-cart"></i> {row?.totalSales || 0}
                  </span> */}
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
        width: 180,
        render: (_, row) => {
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'trademark', value)} allowClear options={trademarks || []} defaultValue={_}></SelectColumn>
        },
      },
      {
        title: "Collection",
        dataIndex: "collection",
        key: "collection",
        width: 180,
        render: (_, row) => {
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'collection', value)} allowClear options={collections || []} defaultValue={_}></SelectColumn>
        },
      },
      {
        title: "Type Tag",
        dataIndex: "tag",
        key: "tag",
        width: 180,
        render: (_, row) => {
          const options = [
            {label: 'black 2D', value: 'black 2D'},
            {label: 'white 2D', value: 'white 2D'},
            {label: '3D style', value: '3D style'},
          ];
          return <SelectColumn onChange={(value) => changePresetPropPin(row.id, 'tag', value)} allowClear options={options} defaultValue={_}></SelectColumn>
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
      // {
      //   title: "User",
      //   key: "user",
      //   width: 120,
      //   render: (_, row) => {
      //     return (
      //       <>
      //         {row?.full_name}
      //         <br />
      //         <i>
      //           <small>{row?.username}</small>
      //         </i>
      //       </>
      //     );
      //   },
      // },
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

          if ("exist" === row?.sync_status) {
            bg = "#faad14";
            color = "#fff";
            icon = <InfoOutlined />;
          }

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
    { label: 'Blacklist', value: '4' },
    { label: 'ErrorSync', value: '5' },
    { label: 'ExistsSync', value: '6' }
  ];

  const reversedData = useMemo(() => [...data].reverse(), [data]);
  return (
    <Wrapper>
       {loading && <div className="overlay"><Spin size="large" /></div>}
      <Space style={{display:'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={syncPins}
            loading={syncing}
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
        rowKey="id"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={reversedData}
        className={styles.customTable}
        scroll={{ x: 1300, y: scrollY}}
        virtual
        pagination={{
          position: ["bottomCenter"],
          total: data?.length || 0,
          showTotal: (total) => `${total} Items Total`,
          onChange: (page, pageSize) => {
            console.log('change', page)
            setPaging({
              current: page,
              pageSize,
            });

            setItemsSelected(0);

            setSelectedRowKeys([]);
          },
          ...paging
        }}
      />
    </Wrapper>
  );
}

export default SpinTable;