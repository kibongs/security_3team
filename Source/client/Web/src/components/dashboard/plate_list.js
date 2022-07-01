import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TableContainer,
  Tooltip
} from '@mui/material';
import { SeverityPill } from '../severity-pill';

function PlateList(props){
  let jwt = props.jwt;

  return(
  <Card {...props}>
    <CardHeader title="License Plate History" />
    <PerfectScrollbar>
      <Box sx={{ minWidth: 800 }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Plate Number
              </TableCell>
              <TableCell>
                Color
              </TableCell>
              <TableCell sortDirection="desc">
                    Make
              </TableCell>
              <TableCell>
                Model
              </TableCell>
              <TableCell>
                Year
              </TableCell>
              <TableCell>
                <Tooltip
                  enterDelay={300}
                  title="Sort"
                >
                  <TableSortLabel
                    active
                    direction="desc"
                  >
                    Status
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jwt && props.plateInfo.map((plate) => (
              <TableRow
                hover
                key={plate.plate}
              >
                <TableCell>
                  {plate.plate}
                </TableCell>
                <TableCell>
                  {plate.vehicle_color}
                </TableCell>
                <TableCell>
                  {plate.vehicle_make}
                </TableCell>
                <TableCell>
                  {plate.vehicle_model}
                </TableCell>
                <TableCell>
                  {plate.vehicle_year}
                </TableCell>
                <TableCell>
                  <SeverityPill
                    color={(plate.status === 'No Wants / Warrants' && 'success')
                    || (plate.status === 'Stolen' && 'error')
                    || (plate.status === 'Owner Wanted' && 'secondary')
                    || (plate.status === 'Unpaid Fines - Tow' && 'warning')}
                  >
                    {plate.status}
                  </SeverityPill>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      </Box>
    </PerfectScrollbar>
  </Card>
  )
};

export default PlateList
