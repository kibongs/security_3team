import {
  Box,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer, 
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { SeverityPill } from '../severity-pill';

function IllegalPlate(props){
  let jwt = props.jwt;

  return (
  <Card {...props}>
    <CardHeader
      title="Illegal License Plate"
    />
    <PerfectScrollbar>
      <Box sx={{ minWidth: 349 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Plate Number
                </TableCell>
                <TableCell>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jwt && props.plateInfo.map((plate) => {
                if(plate.status === "No Wants / Warrants"){
                  return;
                } else {
                return <TableRow
                  hover
                  key={plate.plate}
                >
                  <TableCell>
                    {plate.plate}
                  </TableCell>
                  <TableCell>
                    <SeverityPill
                      color={ (plate.status === 'Stolen' && 'error')
                      || (plate.status === 'Owner Wanted' && 'secondary')
                      || (plate.status === 'Unpaid Fines - Tow' && 'warning')}
                    >
                      {plate.status !== "No Wants / Warrants" && plate.status}
                    </SeverityPill>
                  </TableCell>
                </TableRow>
              }})}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </PerfectScrollbar>
  </Card>
  )
};

export default IllegalPlate;