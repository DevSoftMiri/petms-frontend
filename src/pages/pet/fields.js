export const petColumns = [
  {
    field: "name",
    headerName: "Pet Name",
    width: 160,
  },
  {
    field: "ownerName",
    headerName: "Owner Name",
    width: 180,
    valueGetter: (params) => params.row.ownerName || "-",
  },
  {
    field: "ownerCode",
    headerName: "Customer Code",
    width: 140,
    valueGetter: (params) => params.row.ownerCode || "-",
  },
  {
    field: "species",
    headerName: "Species",
    width: 130,
    valueGetter: (params) => params.row.species || "-",
  },
  {
    field: "colour",
    headerName: "Colour",
    width: 120,
    valueGetter: (params) => params.row.colour || "-",
  },
  {
    field: "gender",
    headerName: "Gender",
    width: 110,
    valueGetter: (params) => params.row.gender || "-",
  },
  {
    field: "breed",
    headerName: "Breed",
    width: 160,
    valueGetter: (params) => params.row.breed || "-",
  },
];