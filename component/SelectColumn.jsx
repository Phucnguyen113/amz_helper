import React, { useEffect } from "react";
import { Select } from "antd";

export const SelectColumn = ({options, defaultValue,  ...props}) => {
    return (
        <Select style={{width: 150}} options={options} defaultValue={defaultValue} {...props} />
    )
}