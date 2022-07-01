import { Card, CardHeader, Divider } from '@mui/material';
import OpenAlpr from '../../images/alpr.png';

import { useState, useEffect } from 'react';

function PlateImage(props){
  const [plateImg, setPlateImg] = useState('');

  useEffect(() => {
    if(props.msg){
      setPlateImg(props.msg);
    }
  }, [props.msg]);

  return (
    <Card {...props}>
      <CardHeader title="License Plate(Latest)" />
      <Divider />
      {plateImg.length !== 0 ? <img src={`data:image/png;base64,${plateImg}`} style={{width: '100%', height: '100%'}} alt=""/> : <img src={OpenAlpr} style={{width: '100%', height: '100%'}} alt=""/>}
    </Card>
  );
};

export default PlateImage;