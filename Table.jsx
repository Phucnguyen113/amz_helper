import { Image, Select, Table, Popconfirm, Space, Button, Form, Spin } from "antd";
import React, { useState, useEffect } from "react";
import { usePresetGrouped } from "./utils/hook";
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
  const {pins, setPins, token, setToken, preset, presetUsed, filter, setFilter} = useAppContext();
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState(pins || []);
  const [niche, setNiche] = useState(presetUsed?.niche || null);
  const [paging, setPaging] = useState({
    pageSize: 20,
    current: 1,
  });

  useEffect(() => {
    const filterdata = () => {
      let tempData = [...pins];
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
  }, [pins, filter]);

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
  ];

  const { styles } = useStyle();
  const [filterForm] = Form.useForm();
  return (
    <Wrapper>
       {loading && <div className="overlay"><Spin size="large" /></div>}
      <Space style={{display:'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
        <Space>
          <Button
            type="primary"
            size="small"
            // onClick={handleSync}
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
        </Space>
        <Space >
          <Button size="small" disabled={!Object.values(filter).some(value => value !== undefined && value !== null && value !== '')} onClick={(e) => resetFilter()}>Clear</Button>
          <Filter setOpen={setFilterOpen} isOpen={filterOpen} form={filterForm}></Filter>
        </Space>
      </Space>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data.map(i => { return {...i, key: i.id}})}
        className={styles.customTable}
        scroll={{ x: 'max-content' }}
        pagination={{
          position: ["bottomCenter"],
          total: pins?.length || 0,
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