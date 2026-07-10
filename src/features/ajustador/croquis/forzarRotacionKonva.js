// ============================================================
// src/features/ajustador/croquis/forzarRotacionKonva.js
// Konva calcula la posición del puntero asumiendo que su
// contenedor solo puede estar ESCALADO respecto a su tamaño
// interno (ver Stage.prototype.setPointersPositions en
// node_modules/konva: usa (clientX - rect.left) / scaleX). Esa
// fórmula no es válida cuando el contenedor está además ROTADO
// por CSS (nuestro truco para forzar que todo el croquis se vea
// acostado aunque el teléfono esté parado) — ahí clientX y
// clientY ya no varían en línea recta con las coordenadas
// locales del Stage.
//
// Este parche reemplaza ese cálculo, solo para los Stages
// marcados con `stage.__rotado90ViaCSS = true`, usando la
// trigonometría correcta para una rotación de 90°:
//   local = centroDelStage + rotar(-90°, puntoFisico - centroDelRect)
// ============================================================
import Konva from "konva";

const original = Konva.Stage.prototype.setPointersPositions;

function posicionLocalRotada(stage, clientX, clientY) {
  const rect = stage.content.getBoundingClientRect();
  const dx = clientX - rect.left - rect.width / 2;
  const dy = clientY - rect.top - rect.height / 2;
  return {
    x: stage.width() / 2 + dy,
    y: stage.height() / 2 - dx,
  };
}

Konva.Stage.prototype.setPointersPositions = function (evt) {
  if (!this.__rotado90ViaCSS) {
    return original.call(this, evt);
  }
  evt = evt ? evt : window.event;
  if (evt.touches !== undefined) {
    this._pointerPositions = [];
    this._changedPointerPositions = [];
    Array.prototype.forEach.call(evt.touches, (touch) => {
      const p = posicionLocalRotada(this, touch.clientX, touch.clientY);
      this._pointerPositions.push({ id: touch.identifier, x: p.x, y: p.y });
    });
    Array.prototype.forEach.call(evt.changedTouches || evt.touches, (touch) => {
      const p = posicionLocalRotada(this, touch.clientX, touch.clientY);
      this._changedPointerPositions.push({ id: touch.identifier, x: p.x, y: p.y });
    });
  } else {
    const p = posicionLocalRotada(this, evt.clientX, evt.clientY);
    this.pointerPos = p;
    this._pointerPositions = [{ x: p.x, y: p.y, id: Konva.Util._getFirstPointerId(evt) }];
    this._changedPointerPositions = [{ x: p.x, y: p.y, id: Konva.Util._getFirstPointerId(evt) }];
  }
};
