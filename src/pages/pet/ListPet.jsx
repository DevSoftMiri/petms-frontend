import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Datatable from "../../components/datatable/Datatable";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import { petColumns } from "./fields";

const ListPet = ({ clinicId: propClinicId }) => {
  const { state: clinicState } = useContext(ClinicContext);
  const clinicId = propClinicId || clinicState?.selectedClinicId;

  const pageTitle = "My Pets";
  const navigate = useNavigate();
  const [id, setId] = useState();
  const [data, setData] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);

  const fetchData = useCallback(() => {
    HttpService.getWithAuth(`/clinics/${clinicId}/pets`)
      .then((response) => {
        const raw = response?.data || response || [];
        const pets = Array.isArray(raw) ? raw : raw.data || [];

        // Normalise each pet so the columns (name, ownerName, ownerCode, species, colour, gender, breed) resolve correctly
        const normalised = pets.map((pet) => {
          const owner =
            pet.owner || pet.customer || pet.client || null;
          const ownerName = owner
            ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
            : "";
          const ownerCode = owner?.code || "";
          return {
            ownerName,
            ownerCode,
            ...pet,
            id: pet.id || pet._id,

            species: pet.species || "",
            colour: pet.colour || "",
            gender: pet.gender || "",
            breed: pet.breed || "",
          };
        });

        setData(normalised);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          setData([]);
        } else if (error.response?.data?.errors) {
          error.response.data.errors.forEach((e) =>
            enqueueSnackbar(`${e.field} ${e.message}`, {
              variant: "error",
            })
          );
        } else if (error.response?.data?.message) {
          enqueueSnackbar(error.response.data.message, {
            variant: "error",
          });
        } else {
          enqueueSnackbar(error.message, { variant: "error" });
        }
      });
  }, [clinicId, enqueueSnackbar]);

  useEffect(() => {
    if (clinicId) {
      fetchData();
    }
  }, [clinicId, fetchData]);

  const handleEdit = (params) => {
    navigate("/pets/edit", { state: params.row });
  };

  const handleClickOpen = (id) => {
    setId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = () => {
    HttpService.deleteWithAuth(`/clinics/${clinicId}/pets/${id}`)
      .then(() => {
        fetchData();
        setOpen(false);
        enqueueSnackbar("Pet deleted successfully", {
          variant: "success",
        });
      })
      .catch((error) => {
        if (error.response?.data?.errors) {
          error.response.data.errors.forEach((e) =>
            enqueueSnackbar(`${e.field} ${e.message}`, {
              variant: "error",
            })
          );
        } else if (error.response?.data?.message) {
          enqueueSnackbar(error.response.data.message, {
            variant: "error",
          });
        } else {
          enqueueSnackbar(error.message, { variant: "error" });
        }
      });
  };

  const actionColumn = [
    {
      field: "action",
      headerName: "Action",
      headerAlign: "left",
      align: "left",
      width: 130,
      renderCell: (params) => (
        <div className="cellAction">
          <div
            className="editButton"
            onClick={() => handleEdit(params)}
          >
            Edit
          </div>
          <div
            className="deleteButton"
            onClick={() => handleClickOpen(params.row.id)}
          >
            Delete
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="list">
      <div className="listContainer">
        <Datatable
          title={pageTitle}
          userColumns={petColumns}
          actionColumn={actionColumn}
          data={data}
          to={"/pets/new"}
        />
      </div>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete pet?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this record?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ListPet;