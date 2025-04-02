import React from 'react';
import { Button, message } from 'antd';

const CopyButton = (text) => {
  const handleCopy = async () => {
      await navigator.clipboard.writeText(text);
  };

  return <Button onClick={handleCopy}>Copy Text</Button>;
};

export default CopyButton;