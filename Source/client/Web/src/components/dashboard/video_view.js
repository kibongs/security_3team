import { Button, Card, CardHeader, Divider } from '@mui/material';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import OpenAlpr from '../../images/alpr.png';
import axios from 'axios'; 
import { useState, useEffect } from 'react';

function VideoView(props){
  const host = "http://localhost:4000";
  const [startStop, setStartStop] = useState("stop");
  const [videoView, setVideoView] = useState('');
  
  useEffect(() => {
    if(props.msg){
      setVideoView(props.msg);
    }
  },[props.msg]);

  const startALPR = () => {
    setStartStop("start");
    const _param = {
      type: props.file,
        name: props.fname,
        save: props.save,
        res: props.res,
        ct: props.country,
        jwt: props.jwt
    }

    axios.get(host+"/startAlpr", {
      params: _param,
      header: {}
    }).then((response => {
    }));
  }

  const stopALPR = () => {
    setStartStop("stop");
    axios.get(host+"/stopAlpr", {
    }).then((response => {
    }));
  }
  return (
    <Card {...props}>
      {startStop === "stop" || videoView === null ? 
        <CardHeader
          action={(
              <Button
                endIcon={<PlayArrow fontSize="small" />}
                size="small"
                onClick={startALPR}
              >
              Start ALPR
              </Button>
          )}
          
          title="View"
        /> :
        <CardHeader
          action={(
              <Button
                endIcon={<Stop fontSize="small" />}
                size="small"
                onClick={stopALPR}
              >
              Stop ALPR
              </Button>
          )}
          
          title="View"
        />
      }
      
      <Divider />
      {videoView.length !== 0 ? <img src={`data:image/png;base64,${videoView}`}  style={{width: '100%', height: '100%'}} alt=""/> : <img src={OpenAlpr} style={{width: '100%', height: '100%', objectFit: 'fill'}} alt=""/>}
    </Card>
  );
};

export default VideoView;