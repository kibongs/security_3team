import { Avatar, Card, CardContent, Grid, Typography, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import Language from '@mui/icons-material/Language';
import { useState, useEffect } from 'react';

function CountryInfo(props){
  const [value, setValue] = useState('us');

  const handleRadioChange = (event) => {
    setValue(event.target.value);
  };

  useEffect(() => { 
    props.country(value);
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
            Country Info.
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: 'primary.main',
              height: 35,
              width: 35
            }}
          >
            <Language />
          </Avatar>
        </Grid>
        <Grid item>
          <FormControl>
            <RadioGroup
              row
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="nosave"
              name="row-radio-buttons-group"
              value={value ? value : 'us'}
              onChange={handleRadioChange}
            >
              <FormControlLabel value="us" control={<Radio />} label="United States" />
              <FormControlLabel value="eu" control={<Radio />} label="Europe" />
              <FormControlLabel value="kr" control={<Radio />} label="Korea" />
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
  // <Card {...props} sx={{ height: '100%' }}>
  //   <CardContent>

  //     <Grid
  //       container
  //       spacing={3}
  //       sx={{ justifyContent: 'space-between' }}
  //     >
  //       <Grid item>
  //         <Typography
  //           color="textSecondary"
  //           gutterBottom
  //           variant="overline"
  //         >
  //           Country Info.
  //         </Typography>
  //       </Grid>
  //       <Grid item>
  //         <Avatar
  //           sx={{
  //             backgroundColor: 'primary.main',
  //             height: 35,
  //             width: 35
  //           }}
  //         >
  //           <Language />
  //         </Avatar>
  //       </Grid>
  //         <Grid item>
  //           <FormControl>
  //             <RadioGroup
  //               row
  //               aria-labelledby="demo-radio-buttons-group-label"
  //               defaultValue="nosave"
  //               name="row-radio-buttons-group"
  //               value={value ? value : 'nosave'}
  //               onChange={handleRadioChange}
  //             >
  //               <FormControlLabel value="us" control={<Radio />} label="US" />
  //               <FormControlLabel value="eu" control={<Radio />} label="EU" />
  //               <FormControlLabel value="kr" control={<Radio />} label="KR" />
  //             </RadioGroup>
  //           </FormControl>
  //         </Grid>
  //       </Grid>
        
  //   </CardContent>
  // </Card>
  );
};

export default CountryInfo;
