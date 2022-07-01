import { Avatar, Card, CardContent, Grid, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import Save from '@mui/icons-material/Save';

import { useState, useEffect } from 'react';

function SaveOption(props){
  const [value, setValue] = useState('0');

  const handleRadioChange = (event) => {
    setValue(event.target.value);
  };

  useEffect(() => { 
    props.setSaveType(value);
  }, [value]);

  return (
  <Card {...props} sx={{ height: '100%' }}>
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
            Save File
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: 'success.main',
              height: 35,
              width: 35
            }}
          >
            <Save />
          </Avatar>
        </Grid>
        <Grid item>
          <FormControl>
            <RadioGroup
              row
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="nosave"
              name="row-radio-buttons-group"
              value={value ? value : '0'}
              onChange={handleRadioChange}
            >
              <FormControlLabel value="0" control={<Radio />} label="No Save" />
              <FormControlLabel value="1" control={<Radio />} label="Save" />
              <FormControlLabel value="2" control={<Radio />} label="Save (No ALPR)" />
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
  );
};

export default SaveOption;