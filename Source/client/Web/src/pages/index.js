import { Box, Container, Grid, Avatar, Toolbar, Typography, Tooltip } from '@mui/material';

import InputSource from '../components/dashboard/input_source';
import SaveOption from '../components/dashboard/save_option';
import DisplayConfig from '../components/dashboard/display_config';
import CountryInfo from '../components/dashboard/country_info';
import VideoView from '../components/dashboard/video_view';
import PlateImage from '../components/dashboard/plate_image';
import IllegalPlate from '../components/dashboard/illegal_plate';
import PlateList from '../components/dashboard/plate_list';
import DashboardLayout from '../components/dashboard-layout';
import LockOpen from '@mui/icons-material/LockOpen';

import CloudQueue from '@mui/icons-material/CloudQueue';
import CloudOff from '@mui/icons-material/CloudOff';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

let socket;

const Dashboard = (props) => {
  const ENDPOINT = 'http://localhost:4000';

  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('');
  const [saveType, setSaveType] = useState('');
  const [resType, setResType] = useState('');

  const [videoView, setVideoView] = useState('');
  const [imageView, setImageView] = useState('');
  const [plateInfo, setPlateInfo] = useState([]);

  const [country, setCountry] = useState('');

  const [jwt, setJwt] = useState(sessionStorage.getItem("key"));

  const [serverConnect, setServerConnect] = useState(false);
  const [timeoutString, setTimeoutString] = useState('');

  useEffect(() => {
    return () => {
      if(socket){
        socket.disconnect();
      } 
    };
  }, []);

  useEffect(() => {
    socket = io(ENDPOINT);

    socket.on('connect', (message) => {
      // setServerConnect(true);
    });
    
    socket.on('connect_error', (message) => {
      setServerConnect(false);
    });

  },[ENDPOINT]);

  useEffect(() => {
    socket.on('videoView', (message) => {
      setVideoView(message);
    });

    socket.on('imageView', (message) => {
      setImageView(message);
    });

    socket.on('plateInfo', (message) => {
      let result = message;
      let data = result.result;

      if(data.status !== "fail"){
        setPlateInfo(oldArr => [data, ...oldArr]);
      } else {
        if(data.message === "Invalid token"){
          alert(data.message + ". Please signin again.");
          sessionStorage.clear();
          setJwt("");
          window.location.reload();
        }
      }
    });

    socket.on('alprEnd', (message) => {
      setVideoView('');
    });

    socket.on('serverStatus', (message) => {
      if(message === 200){
        setServerConnect(true);
      } else {
        setServerConnect(false);
      }
    });

    socket.on('queryTimeout', (message) => {
      setTimeoutString(message);
    })
  }, []);

  const signOut = () => {
    sessionStorage.clear();
    setJwt(sessionStorage.getItem("key"));
  }

  return(
  <>
    <Toolbar
      disableGutters
      sx={{
        left: -15,
        px: 2
      }}
    >
      <Box sx={{ flexGrow: 2 }} />
      <Typography
          color="textWarning"
          gutterBottom
          variant="text"
        >
        Status Msg : {timeoutString}
        </Typography>
      <Box sx={{ flexGrow: 0.1 }} />
      <Typography
          color="textSecondary"
          gutterBottom
          variant="overline"
        >
        Server Status
        </Typography>
        <Box sx={{ flexGrow: 0.01 }} />
      {
          serverConnect ?
          <Tooltip title="ALPR Server is Running">
          <Avatar
            sx={{
              backgroundColor: 'success.main',
              height: 35,
              width: 35
            }}
            
          >
          <CloudQueue/></Avatar></Tooltip> :
          <Tooltip title="ALPR Server is Down... Retry...">
          <Avatar
            sx={{
              backgroundColor: 'success.error',
              height: 35,
              width: 35
            }}
            
          >
          <CloudOff/></Avatar></Tooltip>
        }
      <Box sx={{ flexGrow: 0.15 }} />
      <Typography
          color="textSecondary"
          gutterBottom
          variant="overline"
        >
        {jwt !== null && jwt ? <Link to="" style={{ textDecoration: 'none' }} onClick={signOut}>Sign Out</Link>
        : <Link to="/login" style={{ textDecoration: 'none' }}>Sign In</Link>}
        </Typography>
        <Box sx={{ flexGrow: 0.01 }} />
      <Avatar
        sx={{
          backgroundColor: 'success.main',
          height: 35,
          width: 35
        }}
        
      >
        
        <LockOpen/>
      </Avatar>        
    </Toolbar>
    <Container maxWidth={false}>
      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          lg={3}
          sm={6}
          xl={3}
          xs={12}
        >
          <InputSource setFileType={setFileType} setFileName={setFileName}/>
        </Grid>
        <Grid
          item
          xl={3}
          lg={3}
          sm={6}
          xs={12}
        >
          <SaveOption setSaveType={setSaveType}/>
        </Grid>
        <Grid
          item
          xl={3}
          lg={3}
          sm={6}
          xs={12}
        >
          <DisplayConfig setResType={setResType} file={fileType}/>
        </Grid>
        <Grid
          item
          xl={3}
          lg={3}
          sm={6}
          xs={12}
        >
          <CountryInfo country={setCountry} file={fileType} fname={fileName} save={saveType} res={resType}/>
        </Grid>
        <Grid
          item
          xl={3}
          lg={3}
          sm={6}
          xs={12}
        >
          <VideoView jwt={jwt} file={fileType} country={country} fname={fileName} save={saveType} res={resType} msg={videoView}/>
        </Grid>
        <Grid
          item
          xl={3}
          lg={3}
          sm={6}
          xs={12}
        >
          <PlateImage msg={imageView}/>
        </Grid>
        {jwt && 
        <Grid
          item
          xl={3}
          lg={3}
          sm={6}
          xs={12}
        >
          <IllegalPlate plateInfo={plateInfo} jwt={jwt}/>
        </Grid>
        }
        {jwt &&
        <Grid
          item
          lg={12}
          md={12}
          xl={12}
          xs={12}
        >
          <PlateList plateInfo={plateInfo} jwt={jwt}/>
        </Grid>
        }
      </Grid>
    </Container>
  </>
  );
};

Dashboard.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Dashboard;
