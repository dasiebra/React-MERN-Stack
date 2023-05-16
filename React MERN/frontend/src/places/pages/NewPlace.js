import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import Input from '../../shared/components/FormElements/Input';
import Button from '../../shared/components/FormElements/Button';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';
import ImageUpload from '../../shared/components/FormElements/ImageUpload';
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH
} from '../../shared/util/validators';
import { useForm } from '../../shared/hooks/form-hook';
import { useHttpClient } from '../../shared/hooks/http-hook';
import { AuthContext } from '../../shared/context/auth-context';
import './PlaceForm.css';

const NewPlace = () => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [formState, inputHandler] = useForm(
    {
      title: {
        value: '',
        isValid: false
      },
      description: {
        value: '',
        isValid: false
      },
      address: {
        value: '',
        isValid: false
      },
      image: {
        value: null,
        isValid: false
      }
    },
    false
  );

  const navigate = useNavigate();

  const placeSubmitHandler = async event => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', formState.inputs.title.value);
      formData.append('description', formState.inputs.description.value);
      formData.append('address', formState.inputs.address.value);
      formData.append('image', formState.inputs.image.value);
      await sendRequest('http://localhost:8000/api/places', 'POST', formData, {
        Authorization: 'Bearer ' + auth.token
      });
      navigate.push('/');
    } catch (err) {}
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <form className="place-form" onSubmit={placeSubmitHandler}>
        {isLoading && <LoadingSpinner asOverlay />}
        <Input
          id="title"
          element="input"
          type="text"
          label="Titel"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Bitte gib einen gültigen Titel ein."
          onInput={inputHandler}
        />
        <Input
          id="description"
          element="textarea"
          label="Beschreibung"
          validators={[VALIDATOR_MINLENGTH(5)]}
          errorText="Bitte gib eine gültige Beschreibung ein (mindestens 5 Zeichen)."
          onInput={inputHandler}
        />
        <Input
          id="address"
          element="input"
          label="Adresse"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Bitte gib eine gültige Adresse ein."
          onInput={inputHandler}
        />
        <ImageUpload
          id="image"
          onInput={inputHandler}
          errorText="Bitte stelle ein Bild zur Verfügung."
        />
        <Button type="submit" disabled={!formState.isValid}>
          ORT HINZUFÜGEN
        </Button>
      </form>
    </React.Fragment>
  );
};

export default NewPlace;
