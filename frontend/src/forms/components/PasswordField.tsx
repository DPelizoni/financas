"use client";

import { useState } from "react";
import { IconButton, InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = Omit<TextFieldProps, "type">;

// Campo de senha com botão para mostrar ou ocultar o que foi digitado
export default function PasswordField({ InputProps, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              size="small"
              className="app-hit-area"
              onClick={() => setVisible((prev) => !prev)}
              // Mantém o foco no campo ao clicar no botão
              onMouseDown={(event) => event.preventDefault()}
              aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={visible}
              title={visible ? "Ocultar senha" : "Mostrar senha"}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
