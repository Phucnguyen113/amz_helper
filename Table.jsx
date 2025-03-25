import { Image, Table } from "antd";
import React from "react";

function SpinTable({dataSource}) {
    const columns = [
        {
          title: 'Id',
          dataIndex: 'id',
          key: 'id',
        },
        {
          title: 'Title',
          dataIndex: 'title',
          key: 'title',
        },
        {
          title: 'Image',
          dataIndex: 'image',
          key: 'image',
          render: (_, record) => {
            return (
              <>
                <Image src={_} preview={false}/>
              </>
            )
          }
        },
        {
          title: 'Description',
          dataIndex: 'description',
          key: 'description',
        },
    ];

    return (
        <Table columns={columns} dataSource={dataSource}></Table>
    );
}

export default SpinTable;