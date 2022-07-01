import { Avatar, Card, CardContent, Grid, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import CameraAlt from '@mui/icons-material/CameraAlt';

import { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function InputSource(props){
  const fileInput = useRef(null);
  const [value, setValue] = useState('camera');
  const [fileName, setFileName] = useState('webcam');
  const [fileSelectBtn, setFileSelectBtn] = useState(false);
  
  const handleRadioChange = (event) => {
    setValue(event.target.value);
    if(event.target.value === "camera"){
      setFileName("webcam");
    }
    fileInput.current.value = "";
  };

  const handleFileChange = (event) => {
    setFileName(event.target.value.split('\\').pop());
  }

  useEffect(() => { 
    props.setFileName("");
    props.setFileType(value);

    if(value === 'video' || value === 'image'){
      setFileSelectBtn(true);
    } else {
      setFileSelectBtn(false);
    }   
  }, [value]);

  useEffect(() => {
    props.setFileName(fileName);
  }, [fileName]);

  return (
    <Card sx={{ height: '100%' }}
      {...props}
    >
      <CardContent>
        <Grid
          container
          spacing={3}
          sx={{ justifyContent: 'space-between' }}
        >
          <Grid item>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="overline"
            >
              Select Input File Type
            </Typography>
          </Grid>
          <Grid item>
            <Avatar
              sx={{
                backgroundColor: 'error.main',
                height: 35,
                width: 35
              }}
            >
              <CameraAlt />
            </Avatar>
          </Grid>
          <Grid item>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-radio-buttons-group-label"
                name="row-radio-buttons-group"
                value={value ? value : 'camera'}
                onChange={handleRadioChange}
              >
                <FormControlLabel value="camera" control={<Radio />} label="Camera" />
                <FormControlLabel value="video" control={<Radio />} label="Video" />
                <FormControlLabel value="image" control={<Radio />} label="Image" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item>
          {fileSelectBtn &&
          <div className="input-group">
            <div className="custom-file">
              <input ref={fileInput}
                type="file"
                className="custom-file-input"
                id="inputGroupFile01"
                aria-describedby="inputGroupFileAddon01"
                onChange={handleFileChange}
              />
            </div>
          </div>
          }
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default InputSource;