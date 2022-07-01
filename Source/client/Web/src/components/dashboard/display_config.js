import { Avatar, Card, CardContent, Grid, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import Monitor from '@mui/icons-material/Monitor';

import { useState, useEffect } from 'react';

function DisplayConfig(props){
  const [value, setValue] = useState('0');

  const handleRadioChange = (event) => {
    setValue(event.target.value);
  };

  useEffect(() => { 
    props.setResType(value);
  }, [value]);

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
            Display Configuration
          </Typography>
          <br/><br/>
        <Grid item>
          <FormControl>
            <RadioGroup
              row
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="first"
              name="row-radio-buttons-group"
              value={value ? value : 'first'}
              onChange={handleRadioChange}
            >
              <FormControlLabel value="0" control={<Radio />} label="Off" />
              <FormControlLabel value="1" control={<Radio />} label="On" />
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
      <Grid item>
      <Avatar
        sx={{
          backgroundColor: 'warning.main',
          height: 35,
          width: 35
        }}
      >
        <Monitor />
      </Avatar>
      </Grid>
      </Grid>
    </CardContent>
  </Card>
  );
};

export default DisplayConfig;
