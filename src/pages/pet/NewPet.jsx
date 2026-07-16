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
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Sidebar from "../../components/sidebar/Sidebar";
import HttpService from "../../services/HttpService";
import { ClinicContext } from "../../context/clinicContext";
import "./pet.css";

const NewPet = () => {
  const pageTitle = "Add New Animal Intake";
  const { state: clinicState } = useContext(ClinicContext);
  const clinicId = clinicState?.selectedClinicId;
  const defaultValues = {
    intakeDate: new Date().toISOString().split("T")[0],
    formNumber: "",
    intakeType: "RESCUE",
    rescuerName: "",
    rescuerPhone: "",
    rescuerEmail: "",
    rescuerAddress: "",
    rescueLocationCondition: "",
    name: "",
    species: "",
    breed: "",
    colour: "",
    gender: "",
    age: "",
    weight: "",
    neutered: "Unknown",
    vaccinationStatus: "Unknown",
    medicalHistoryVetDetails: "",
    medicalNotes: "",
  };

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(defaultValues);

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
    if (!formValues.rescuerName || !formValues.name || !formValues.species) {
      enqueueSnackbar("Rescuer/contact name, animal name, and species are required", { variant: "error" });
      return;
    }
    const submittedData = {
      intakeDate: formValues.intakeDate,
      formNumber: formValues.formNumber || undefined,
      intakeType: formValues.intakeType,
      rescuerName: formValues.rescuerName,
      rescuerPhone: formValues.rescuerPhone || undefined,
      rescuerEmail: formValues.rescuerEmail || undefined,
      rescuerAddress: formValues.rescuerAddress || undefined,
      rescueLocationCondition: formValues.rescueLocationCondition || undefined,
      name: formValues.name,
      species: formValues.species,
      breed: formValues.breed || undefined,
      colour: formValues.colour || undefined,
      gender: formValues.gender || undefined,
      age: formValues.age ? parseInt(formValues.age) : undefined,
      weight: formValues.weight ? parseFloat(formValues.weight) : undefined,
      neutered: formValues.neutered || undefined,
      vaccinationStatus: formValues.vaccinationStatus || undefined,
      medicalHistoryVetDetails: formValues.medicalHistoryVetDetails || undefined,
      medicalNotes: formValues.medicalNotes || undefined,
    };
    HttpService.postWithAuth(`/clinics/${clinicId}/pets`, submittedData)
      .then((response) => {
        enqueueSnackbar("Animal intake created successfully", { variant: "success" });
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
                  required
                  id="intakeDate"
                  name="intakeDate"
                  label="Date"
                  type="date"
                  value={formValues.intakeDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="formNumber"
                  name="formNumber"
                  label="Form No"
                  type="text"
                  value={formValues.formNumber}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <FormControl sx={{ width: 240 }}>
                  <InputLabel id="intake-type-label">Intake Type</InputLabel>
                  <Select
                    name="intakeType"
                    label="Intake Type"
                    value={formValues.intakeType}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="RESCUE">Rescue</MenuItem>
                    <MenuItem value="SURRENDER">Surrender</MenuItem>
                    <MenuItem value="TREATMENT">Treatment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  autoFocus
                  required
                  id="rescuerName"
                  name="rescuerName"
                  label="Rescuer / Contact Name"
                  type="text"
                  value={formValues.rescuerName}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="rescuerPhone"
                  name="rescuerPhone"
                  label="Contact No."
                  type="text"
                  value={formValues.rescuerPhone}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="rescuerEmail"
                  name="rescuerEmail"
                  label="Email ID"
                  type="email"
                  value={formValues.rescuerEmail}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="rescuerAddress"
                  name="rescuerAddress"
                  label="Address"
                  type="text"
                  value={formValues.rescuerAddress}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  required
                  id="name"
                  name="name"
                  label="Name of Animal"
                  type="text"
                  value={formValues.name}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <FormControl sx={{ width: 240 }}>
                  <InputLabel id="species-label">Type of Animal *</InputLabel>
                  <Select
                    required
                    name="species"
                    label="Type of Animal *"
                    value={formValues.species}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">
                      <em>Select type</em>
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
                  <InputLabel id="gender-label">Sex</InputLabel>
                  <Select
                    name="gender"
                    label="Sex"
                    value={formValues.gender}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">
                      <em>Select sex</em>
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
                  label="Age"
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
                <FormControl sx={{ width: 240 }}>
                  <InputLabel id="neutered-label">Neutered</InputLabel>
                  <Select
                    name="neutered"
                    label="Neutered"
                    value={formValues.neutered}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="Unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item>
                <FormControl sx={{ width: 240 }}>
                  <InputLabel id="vaccination-status-label">Vaccination Status</InputLabel>
                  <Select
                    name="vaccinationStatus"
                    label="Vaccination Status"
                    value={formValues.vaccinationStatus}
                    onChange={handleInputChange}
                  >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                    <MenuItem value="Unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="rescueLocationCondition"
                  name="rescueLocationCondition"
                  label="Location / Condition"
                  multiline
                  rows={3}
                  value={formValues.rescueLocationCondition}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item>
                <TextField
                  sx={{ width: 240 }}
                  id="medicalHistoryVetDetails"
                  name="medicalHistoryVetDetails"
                  label="Medical History & Vet Details"
                  multiline
                  rows={3}
                  value={formValues.medicalHistoryVetDetails}
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
                Create Intake
              </Button>
            </Stack>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPet;
