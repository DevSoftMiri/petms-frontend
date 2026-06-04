import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const initialPetForm = {
    customerId: "",
    name: "",
    species: "",
    colour: "",
    breed: "",
    gender: "",
    age: "",
    weight: "",
    medicalNotes: "",
  };
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [petForm, setPetForm] = useState(initialPetForm);

  // Vet assignment state
  const [vets, setVets] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPetForAssign, setSelectedPetForAssign] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const parseArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  };

  const fetchCustomers = useCallback(async () => {
    if (!clinicId) return;

    try {
      const res = await HttpService.getWithAuth(`/clinics/${clinicId}/customers?limit=100`);
      setCustomers(parseArrayResponse(res));
    } catch (error) {
      console.error("Error fetching customers:", error);
      enqueueSnackbar("Failed to load customers", { variant: "error" });
    }
  }, [clinicId, enqueueSnackbar]);

  const handleOpenAddPet = () => {
    setPetForm(initialPetForm);
    setAddPetOpen(true);
    fetchCustomers();
  };

  const handlePetFormChange = (event) => {
    const { name, value } = event.target;
    setPetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePet = async (event) => {
    event.preventDefault();

    if (!clinicId) {
      enqueueSnackbar("Clinic ID not available", { variant: "error" });
      return;
    }

    if (!petForm.customerId || !petForm.name || !petForm.species) {
      enqueueSnackbar("Owner, pet name, and species are required", { variant: "error" });
      return;
    }

    const payload = {
      customerId: petForm.customerId,
      name: petForm.name,
      species: petForm.species,
      colour: petForm.colour || undefined,
      breed: petForm.breed || undefined,
      gender: petForm.gender || undefined,
      age: petForm.age ? Number(petForm.age) : undefined,
      weight: petForm.weight ? Number(petForm.weight) : undefined,
      medicalNotes: petForm.medicalNotes || undefined,
    };

    setSavingPet(true);
    try {
      await HttpService.postWithAuth(`/clinics/${clinicId}/pets`, payload);
      enqueueSnackbar("Pet created successfully", { variant: "success" });
      setAddPetOpen(false);
      setPetForm(initialPetForm);
      fetchData();
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((e) =>
          enqueueSnackbar(`${e.field} ${e.message}`, { variant: "error" })
        );
      } else if (error.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar(error.message, { variant: "error" });
      }
    } finally {
      setSavingPet(false);
    }
  };

  // Fetch vets for assignment
  const fetchVets = useCallback(async () => {
    try {
      const res = await HttpService.getWithAuth(`/users?clinicId=${clinicId}&role=VET`);
      setVets(res.data || []);
    } catch (error) {
      console.error("Error fetching vets:", error);
    }
  }, [clinicId]);

  // Open assign modal
  const handleOpenAssignModal = useCallback((pet) => {
    setSelectedPetForAssign(pet);
    setAssignModalOpen(true);
    fetchVets();
  }, [fetchVets]);

  // Assign pet to vet
  const handleAssignVet = async (vetId) => {
    if (!selectedPetForAssign || !vetId) return;
    setAssigning(true);
    try {
      const response = await HttpService.putWithAuth(`/clinics/${clinicId}/pets/${selectedPetForAssign.id}/assign-vet`, { vetId });
      console.log("Pet assignment response:", response);
      enqueueSnackbar("✅ Pet assigned to vet successfully", { variant: "success" });
      setAssignModalOpen(false);
      setSelectedPetForAssign(null);
      setTimeout(() => fetchData(), 500);
    } catch (error) {
      console.error("Error assigning pet:", error.response?.data || error.message);
      enqueueSnackbar(error.response?.data?.message || "Failed to assign pet", { variant: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const fetchData = useCallback(() => {
    if (!clinicId) {
      console.warn("ListPet: clinicId is not available");
      setLoading(false);
      setError("Clinic ID not available");
      return;
    }

    setLoading(true);
    setError(null);

    HttpService.getWithAuth(`/clinics/${clinicId}/pets`)
      .then((response) => {
        console.log("Pets response:", response);

        // Handle the paginated response format from backend
        // Backend returns: { success, message, data: [...], pagination: {...} }
        let pets = [];

        if (response?.data) {
          // If response.data is an array (from direct Axios response)
          if (Array.isArray(response.data)) {
            pets = response.data;
          }
          // If response.data has a data property (paginated format)
          else if (response.data.data && Array.isArray(response.data.data)) {
            pets = response.data.data;
          }
          // If response.data.data is an array
          else if (response.data?.data && Array.isArray(response.data.data)) {
            pets = response.data.data;
          }
        }
        // Direct array response
        else if (Array.isArray(response)) {
          pets = response;
        }

        console.log("Extracted pets:", pets);

        // Normalise each pet so the columns resolve correctly
        const normalised = pets.map((pet) => {
          const owner =
            pet.owner || pet.customer || pet.client || null;
          const ownerName = owner
            ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
            : "";
          const ownerCode = owner?.code || "";
          const assignedVetName = pet.assignedVet
            ? `Dr. ${`${pet.assignedVet.firstName || ""} ${pet.assignedVet.lastName || ""}`.trim()}`.trim()
            : "";
          const hasPreviousCases = Array.isArray(pet.vetCases) && pet.vetCases.length > 0;
          const actionLabel = pet.assignedVetId || hasPreviousCases ? (pet.assignedVetId ? assignedVetName || "Reassign" : "Reassign") : "Assign to Vet";
          const actionTitle = pet.assignedVetId
            ? `Click to reassign ${assignedVetName || pet.name}`
            : hasPreviousCases
              ? `Click to reassign ${pet.name}`
              : "Assign to Vet";

          return {
            ownerName,
            ownerCode,
            assignedVetName,
            hasPreviousCases,
            ...pet,
            id: pet.id || pet._id,

            species: pet.species || "",
            colour: pet.colour || "",
            gender: pet.gender || "",
            breed: pet.breed || "",
            actions: (
              <button
                className="assign-vet-btn"
                onClick={() => handleOpenAssignModal(pet)}
                style={{
                  padding: "6px 12px",
                  background: pet.assignedVetId || hasPreviousCases ? "#0284c7" : "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={actionTitle}
              >
                {actionLabel}
              </button>
            ),
          };
        });

        setData(normalised);
        setLoading(false);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching pets:", error);
        setLoading(false);
        setData([]);

        let errorMessage = "Failed to load pets";

        if (error.response?.status === 404) {
          setError(null);
          setData([]);
        } else if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join(", ");
          setError(errorMessage);
          error.response.data.errors.forEach((e) =>
            enqueueSnackbar(`${e.field} ${e.message}`, {
              variant: "error",
            })
          );
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
          enqueueSnackbar(error.response.data.message, {
            variant: "error",
          });
        } else {
          setError(error.message);
          enqueueSnackbar(error.message, { variant: "error" });
        }
      });
  }, [clinicId, enqueueSnackbar, handleOpenAssignModal]);

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
        {!clinicId && (
          <div style={{ padding: "20px", textAlign: "center", color: "orange" }}>
            <p>Clinic ID not available. Please navigate from the clinic dashboard.</p>
          </div>
        )}

        {clinicId && loading && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>Loading pets...</p>
          </div>
        )}

        {clinicId && error && (
          <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
            <p>Error: {error}</p>
            <button onClick={() => fetchData()} style={{ marginTop: "10px" }}>
              Retry
            </button>
          </div>
        )}

        {clinicId && !loading && !error && (
          <Datatable
            title={pageTitle}
            userColumns={petColumns}
            actionColumn={actionColumn}
            data={data}
            onAdd={handleOpenAddPet}
          />
        )}
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

      <Dialog open={addPetOpen} onClose={() => setAddPetOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Pet</DialogTitle>
        <form onSubmit={handleCreatePet}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="pet-owner-label">Owner Name</InputLabel>
                  <Select
                    labelId="pet-owner-label"
                    name="customerId"
                    label="Owner Name"
                    value={petForm.customerId}
                    onChange={handlePetFormChange}
                  >
                    <MenuItem value="">
                      <em>Select existing customer</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                        {customer.customerId || customer.code
                          ? ` (${customer.customerId || customer.code})`
                          : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  name="name"
                  label="Pet Name"
                  value={petForm.name}
                  onChange={handlePetFormChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="pet-species-label">Species</InputLabel>
                  <Select
                    labelId="pet-species-label"
                    name="species"
                    label="Species"
                    value={petForm.species}
                    onChange={handlePetFormChange}
                  >
                    <MenuItem value="">
                      <em>Select species</em>
                    </MenuItem>
                    <MenuItem value="Dog">Dog</MenuItem>
                    <MenuItem value="Cat">Cat</MenuItem>
                    <MenuItem value="Bird">Bird</MenuItem>
                    <MenuItem value="Rabbit">Rabbit</MenuItem>
                    <MenuItem value="Hamster">Hamster</MenuItem>
                    <MenuItem value="Guinea Pig">Guinea Pig</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="colour"
                  label="Colour"
                  value={petForm.colour}
                  onChange={handlePetFormChange}
                  placeholder="Brown, Black, White"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="breed"
                  label="Breed"
                  value={petForm.breed}
                  onChange={handlePetFormChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="pet-gender-label">Gender</InputLabel>
                  <Select
                    labelId="pet-gender-label"
                    name="gender"
                    label="Gender"
                    value={petForm.gender}
                    onChange={handlePetFormChange}
                  >
                    <MenuItem value="">
                      <em>Select gender</em>
                    </MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="age"
                  label="Age"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={petForm.age}
                  onChange={handlePetFormChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="weight"
                  label="Weight (kg)"
                  type="number"
                  inputProps={{ min: 0, step: "0.1" }}
                  value={petForm.weight}
                  onChange={handlePetFormChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  name="medicalNotes"
                  label="Medical Notes"
                  value={petForm.medicalNotes}
                  onChange={handlePetFormChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddPetOpen(false)} disabled={savingPet}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={savingPet}>
              {savingPet ? "Adding..." : "Add Pet"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign to Vet Modal */}
      <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Pet to Vet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a veterinarian to assign <strong>{selectedPetForAssign?.name}</strong>:
          </DialogContentText>
          <div style={{ marginTop: "15px" }}>
            {vets.length === 0 ? (
              <p>No vets available in this clinic</p>
            ) : (
              vets.map((vet) => (
                <Button
                  key={vet.id}
                  variant="outlined"
                  onClick={() => handleAssignVet(vet.id)}
                  disabled={assigning}
                  style={{
                    display: "block",
                    width: "100%",
                    marginBottom: "8px",
                    textTransform: "none",
                    textAlign: "left",
                  }}
                >
                  Dr. {vet.firstName} {vet.lastName} ({vet.email})
                </Button>
              ))
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ListPet;
