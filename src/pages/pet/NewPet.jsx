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
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Sidebar from "../../components/sidebar/Sidebar";
import AuthService from "../../services/AuthService";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import "./pet.css";

const NewPet = () => {
  const pageTitle = "Add New Pet";
  const { state: clinicState } = useContext(ClinicContext);
  const clinicId = clinicState?.selectedClinicId;
  const defaultValues = {
    name: "",
    species: "",
    breed: "",
    colour: "",
    gender: "",
    age: "",
    weight: "",
    dateOfBirth: "",
    bloodGroup: "",
    medicalNotes: "",
    userId: AuthService.getCurrentUser()?.id,
  };

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(defaultValues);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    const getTypes = async () => {
      const response = await HttpService.getWithAuth("/types");
      const types = await response.data.content;
      setTypes(types);
    };
    getTypes();
  }, []);

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
    const submittedData = {
      name: formValues.name,
      species: formValues.species,
      breed: formValues.breed || undefined,
      colour: formValues.colour || undefined,
      gender: formValues.gender || undefined,
      age: formValues.age ? parseInt(formValues.age) : undefined,
      weight: formValues.weight ? parseFloat(formValues.weight) : undefined,
      dateOfBirth: formValues.dateOfBirth ? new Date(formValues.dateOfBirth).toISOString() : undefined,
      bloodGroup: formValues.bloodGroup || undefined,
      medicalNotes: formValues.medicalNotes || undefined,
      userId: formValues.userId,
    };
    HttpService.postWithAuth(`/clinics/${clinicId}/pets`, submittedData)
      .then((response) => {
        enqueueSnackbar("Pet created successfully", { variant: "success" });
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
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={formValues.dateOfBirth}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
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
                  id="bloodGroup"
                  name="bloodGroup"
                  label="Blood Group"
                  type="text"
                  placeholder="e.g., DEA 1.1+, A, B"
                  value={formValues.bloodGroup}
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
                Add
              </Button>
            </Stack>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPet;
