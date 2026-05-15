import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import "./pet.css";

const EditPet = () => {
  const pageTitle = "Edit Pet";
  const { state } = useLocation();
  const { state: clinicState } = useContext(ClinicContext);
  const clinicId = clinicState?.selectedClinicId;
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    name: "",
    species: "",
    breed: "",
    colour: "",
    gender: "",
    age: "",
    weight: "",
    medicalNotes: "",
  });

  // Initialize form with pet data from state
  useEffect(() => {
    if (state) {
      setFormValues({
        name: state.name || "",
        species: state.species || "",
        breed: state.breed || "",
        colour: state.colour || "",
        gender: state.gender || "",
        age: state.age ? String(state.age) : "",
        weight: state.weight ? String(state.weight) : "",
        medicalNotes: state.medicalNotes || "",
      });
    }
  }, [state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!clinicId) {
      enqueueSnackbar("No clinic selected", { variant: "error" });
      return;
    }
    if (!formValues.name || !formValues.species) {
      enqueueSnackbar("Pet name and species are required", { variant: "error" });
      return;
    }

    const petId = state?.id || state?._id || state?.petId;
    if (!petId) {
      enqueueSnackbar("Pet ID is missing", { variant: "error" });
      return;
    }

    const submittedData = {
      name: formValues.name,
      species: formValues.species,
      gender: formValues.gender || undefined,
      colour: formValues.colour || undefined,
      breed: formValues.breed || undefined,
      age: formValues.age ? parseInt(formValues.age) : undefined,
      weight: formValues.weight ? parseFloat(formValues.weight) : undefined,
      medicalNotes: formValues.medicalNotes || undefined,
    };

    HttpService.putWithAuth(`/clinics/${clinicId}/pets/${petId}`, submittedData)
      .then((response) => {
        enqueueSnackbar("Pet updated successfully", { variant: "success" });
        navigate("/pets");
      })
      .catch((error) => {
        if (error.response?.data?.errors) {
          error.response?.data?.errors.map((e) =>
            enqueueSnackbar(e.field + " " + e.message, { variant: "error" })
          );
        } else if (error.response?.data?.message) {
          enqueueSnackbar(error.response?.data?.message, { variant: "error" });
        } else {
          enqueueSnackbar(error.message, { variant: "error" });
        }
      });
  };

  if (!state) {
    return (
      <div className="single">
        <Sidebar />
        <div className="singleContainer">
          <Navbar />
          <div className="bottom">
            <p>No pet data provided. Please select a pet to edit.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="single">
      <Sidebar />
      <div className="singleContainer">
        <Navbar />
        <div className="bottom">
          <h1 className="title">{pageTitle}</h1>
          <form onSubmit={handleSubmit}>
            <Grid
              container
              alignItems="left"
              justify="center"
              direction="column"
              spacing={2}
            >
              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  autoFocus
                  required
                  id="name"
                  name="name"
                  label="Pet Name"
                  type="text"
                  value={formValues.name}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <FormControl sx={{ width: 240 }}>
                  <InputLabel id="species-label">Species *</InputLabel>
                  <Select
                    required
                    name="species"
                    label="Species *"
                    value={formValues.species}
                    onChange={handleInputChange}
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

              <Grid item>
                <FormControl sx={{ width: 240 }}>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    name="gender"
                    label="Gender"
                    value={formValues.gender}
                    onChange={handleInputChange}
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

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="colour"
                  name="colour"
                  label="Colour"
                  type="text"
                  value={formValues.colour}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="breed"
                  name="breed"
                  label="Breed"
                  type="text"
                  value={formValues.breed}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="age"
                  name="age"
                  label="Age (months)"
                  type="number"
                  value={formValues.age}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="weight"
                  name="weight"
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  value={formValues.weight}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="medicalNotes"
                  name="medicalNotes"
                  label="Medical Notes"
                  multiline
                  rows={3}
                  value={formValues.medicalNotes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            <Stack spacing={2} sx={{ py: 3, paddingRight: 0 }} direction="row">
              <Button
                sx={{ minWidth: 112 }}
                variant="outlined"
                onClick={() => navigate("/pets")}
              >
                Cancel
              </Button>
              <Button sx={{ minWidth: 112 }} type="submit" variant="contained">
                Save
              </Button>
            </Stack>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPet;