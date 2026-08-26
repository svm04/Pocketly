// Triggers a browser "Save As" for a blob response (e.g. an axios request
// made with `responseType: "blob"`) without navigating away from the SPA.
export const downloadBlob = (blobData, filename) => {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
