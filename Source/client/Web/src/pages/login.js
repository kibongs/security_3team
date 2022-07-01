import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Container, Grid, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useNavigate  } from 'react-router-dom';
import axios from 'axios'; 

function Login(props) {
    const navigate = useNavigate();
    const onCancel = () =>{
        navigate(-1);
    }

  const formik = useFormik({
    initialValues: {
      email: 'test@gmail.com',
      password: 'test123',
      otp: '123456'
    },
    validationSchema: Yup.object({
    email: Yup
        .string()
        .email(
          'Must be a valid email')
        .max(80)
        .required(
          'Email is required'),
    password: Yup
        .string()
        .max(255)
        .required(
          'Password is required'),
    otp: Yup
        .number()
        .required(
                'OTP is required')
        }),
    onSubmit: (values) => {
        const formData = new URLSearchParams();
        formData.append("email", values.email);
        formData.append("password", values.password);
        formData.append("otp", values.otp);

        axios.post('http://localhost:4000/login', null, {
            params: formData
        }).then((response => {
            if(response.data.result.status !== "fail"){
              sessionStorage.setItem("key",response.data.result.token);
              onCancel();
            } else {
                alert(response.data.result.message);
            }
        }));
    }
  });

  return (
    <>
      <Box
        component="main"
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexGrow: 1,
          minHeight: '100%'
        }}
      >
        <Container maxWidth="sm">
            <Button
              component="a"
              startIcon={<ArrowBackIcon fontSize="small" />}
            >
            <Link to="/" style={{ textDecoration: 'none' }}>Dashboard</Link>
            </Button>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ my: 3 }}>
              <Typography
                color="textPrimary"
                variant="h4"
              >
                Sign in
              </Typography>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                Sign in on ALPR platform
              </Typography>
            </Box>
            <Grid
              container
              spacing={3}
            >
            </Grid>
            <Box
              sx={{
                pb: 1,
                pt: 3
              }}
            >
              
            </Box>
            <TextField
              error={Boolean(formik.touched.email && formik.errors.email)}
              fullWidth
              helperText={formik.touched.email && formik.errors.email}
              label="Email Address"
              margin="normal"
              name="email"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              type="email"
              value={formik.values.email}
              variant="outlined"
            />
            <TextField
              error={Boolean(formik.touched.password && formik.errors.password)}
              fullWidth
              helperText={formik.touched.password && formik.errors.password}
              label="Password"
              margin="normal"
              name="password"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              type="password"
              value={formik.values.password}
              variant="outlined"
            />
            <TextField
              error={Boolean(formik.touched.otp && formik.errors.otp)}
              fullWidth
              helperText={formik.touched.otp && formik.errors.otp}
              label="OTP"
              margin="normal"
              name="otp"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              type="password"
              value={formik.values.otp}
              variant="outlined"
            />
            <Box sx={{ py: 2 }}>
              <Button
                color="primary"
                fullWidth
                size="large"
                type="submit"
                variant="contained"
              >
                Sign In Now
              </Button>
            </Box>
          </form>
          
        </Container>
      </Box>
    </>
  );
};

export default Login;