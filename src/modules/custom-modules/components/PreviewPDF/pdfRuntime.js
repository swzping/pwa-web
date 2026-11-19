// Emit native modules unchanged: Webpack 4 cannot parse PDF.js top-level await.
// Hashes keep the API and worker from the same installed release in sync.
import moduleUrl from '!!file-loader?name=pdfjs/[name].[contenthash].js!pdfjs-dist/legacy/build/pdf.min.mjs';
import workerUrl from '!!file-loader?name=pdfjs/[name].[contenthash].js!pdfjs-dist/legacy/build/pdf.worker.min.mjs';

export { workerUrl };
export let GlobalWorkerOptions;
export let PDFWorker;
export let PasswordResponses;
export let getDocument;
export let renderTextLayer;

let loading;

// The viewer consumes these live exports only after loading has completed.
export const loadPdfRuntime = () => {
    if (!loading) {
        loading = import(/* webpackIgnore: true */ moduleUrl)
            .then(api => {
                GlobalWorkerOptions = api.GlobalWorkerOptions;
                PDFWorker = api.PDFWorker;
                PasswordResponses = api.PasswordResponses;
                getDocument = api.getDocument;
                renderTextLayer = api.renderTextLayer;
            })
            .catch(error => {
                loading = undefined;
                throw error;
            });
    }
    return loading;
};
