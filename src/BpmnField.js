import React from "react";
import ReactBpmn from "react-bpmn";

const BpmnField = ({ record }) => {
  const { diagram } = record;
  return <ReactBpmn diagramXML={diagram} />;
};

export default BpmnField;
