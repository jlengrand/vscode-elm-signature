export class Utils{
    // TODO: Extract workspace part only
    basename(path) {
        return path.split('/').reverse()[0];
    }
}