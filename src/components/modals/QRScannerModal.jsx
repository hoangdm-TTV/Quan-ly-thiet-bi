import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraOff, Keyboard, Upload, X } from 'lucide-react';

export const QRScannerModal = ({ onDetected, onClose }) => {
  const videoRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const controlsRef = useRef(null);
  const readerRef = useRef(null);
  const mountedRef = useRef(true);
  const detectedRef = useRef(false);
  const [status, setStatus] = useState('Đang kết nối camera…');
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (!readerRef.current) readerRef.current = new BrowserQRCodeReader();

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  const startCamera = async () => {
    setError('');
    setUploadError('');
    setIsStartingCamera(true);
    setStatus('Đang yêu cầu mở camera…');

    if (window.isSecureContext === false) {
      setError('Camera cần kết nối bảo mật. Hãy mở ứng dụng bằng HTTPS; địa chỉ http://localhost chỉ dùng được trên chính máy đang chạy web.');
      setIsStartingCamera(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không cho phép mở camera. Bạn vẫn có thể chụp/chọn ảnh QR hoặc nhập mã bên dưới.');
      setIsStartingCamera(false);
      return;
    }

    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsCameraStarted(false);
    setIsVideoPlaying(false);
    try {
      // Call getUserMedia from the user's tap. Safari may leave the preview blank
      // when camera startup is deferred to an effect after the tap has ended.
      const controls = await readerRef.current.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result) => {
          if (!mountedRef.current || detectedRef.current || !result) return;
          detectedRef.current = true;
          controlsRef.current?.stop();
          onDetectedRef.current(result.getText());
        }
      );

      if (!mountedRef.current) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
      setIsCameraStarted(true);
      if (videoRef.current?.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoRef.current.videoWidth > 0) {
        setIsVideoPlaying(true);
        setStatus('Camera đã hoạt động. Đưa camera sau vào gần tem và giữ QR trong khung.');
      } else {
        setStatus('Đang chờ hình ảnh từ camera…');
      }
    } catch (cameraError) {
      if (!mountedRef.current) return;
      if (cameraError.name === 'NotAllowedError' || cameraError.name === 'PermissionDeniedError') {
        setError('Chưa được cấp quyền camera. Mở phần cài đặt trang web trên điện thoại, bật Camera rồi thử lại.');
      } else if (cameraError.name === 'NotFoundException' || cameraError.name === 'NotFoundError') {
        setError('Không tìm thấy camera. Kiểm tra thiết bị hoặc dùng cách chụp/chọn ảnh QR bên dưới.');
      } else {
        setError('Không mở được camera. Đóng ứng dụng khác đang dùng camera rồi thử lại.');
      }
      setIsCameraStarted(false);
    } finally {
      if (mountedRef.current) setIsStartingCamera(false);
    }
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setUploadError('');
    setIsReadingImage(true);
    setStatus('Đang đọc mã QR trong ảnh…');

    const imageUrl = URL.createObjectURL(file);
    try {
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(imageUrl);
      detectedRef.current = true;
      onDetectedRef.current(result.getText());
    } catch {
      setUploadError('Không tìm thấy QR đọc được trong ảnh. Hãy chụp rõ, đủ sáng và để trọn mã trong khung.');
      setStatus('Camera vẫn mở để bạn thử quét trực tiếp hoặc chọn ảnh khác.');
    } finally {
      URL.revokeObjectURL(imageUrl);
      setIsReadingImage(false);
    }
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    if (!manualCode.trim()) return;
    detectedRef.current = true;
    onDetectedRef.current(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title">
      <section className="flex h-screen max-h-screen h-[100dvh] max-h-[100dvh] w-full flex-col overflow-y-auto bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-xl sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Camera className="h-5 w-5" /></span>
            <div>
              <h2 id="qr-scanner-title" className="text-base font-bold text-slate-900">Quét QR tài sản</h2>
              <p className="mt-0.5 text-xs text-slate-600">Mã QR cần chứa mã tài sản hoặc Serial</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng máy quét" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-4 bg-slate-50 p-4 sm:p-5">
          <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-inner sm:aspect-video ${isCameraStarted ? 'bg-slate-950' : 'border border-slate-200 bg-slate-100'}`}>
            <video ref={videoRef} className={`absolute inset-0 h-full w-full object-cover ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`} playsInline muted autoPlay onPlaying={() => {
              setIsVideoPlaying(true);
              setError('');
              setStatus('Camera đã hoạt động. Đưa camera sau vào gần tem và giữ QR trong khung.');
            }} onError={() => {
              setIsVideoPlaying(false);
              setError('Camera đã mở nhưng trình duyệt không hiển thị được hình. Hãy thử lại hoặc chụp/chọn ảnh QR bên dưới.');
            }} />
            {isVideoPlaying && !error && <>
              <div className="pointer-events-none absolute inset-[13%] rounded-2xl border-[3px] border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,0.32)]" />
              <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-slate-950/80 px-3 py-2 text-center text-sm font-semibold text-white">Đặt mã QR vào giữa khung</p>
            </>}
            {!isVideoPlaying && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <CameraOff className={`h-9 w-9 ${error ? 'text-rose-600' : 'text-slate-500'}`} />
              <p className="text-base font-semibold text-slate-800">{error ? 'Camera chưa sẵn sàng' : isStartingCamera || isCameraStarted ? 'Đang kết nối camera…' : 'Chưa bật camera'}</p>
              {!error && !isStartingCamera && !isCameraStarted && <p className="max-w-xs text-sm leading-5 text-slate-600">Bấm nút bên dưới để cho phép trang sử dụng camera.</p>}
            </div>}
          </div>

          <div className={`rounded-xl border px-3.5 py-3 text-center text-sm leading-5 ${error || uploadError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-blue-200 bg-blue-50 text-blue-900'}`} role="status">
            {uploadError || error || status}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${isReadingImage ? 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400' : 'border-blue-200 bg-white text-blue-800 hover:bg-blue-50'}`}>
              <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={isReadingImage} onChange={handleImageSelection} />
              <Upload className="h-4 w-4" /> {isReadingImage ? 'Đang đọc ảnh…' : 'Chụp / chọn ảnh QR'}
            </label>
            <form onSubmit={handleManualSubmit} className="flex min-w-0 gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Nhập mã tài sản hoặc Serial</span>
                <Keyboard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Nhập mã / Serial" className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </label>
              <button type="submit" disabled={!manualCode.trim()} className="min-h-12 shrink-0 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">Dùng mã</button>
            </form>
          </div>
          <button type="button" onClick={startCamera} disabled={isStartingCamera || isVideoPlaying} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            <Camera className="h-4 w-4" /> {isStartingCamera ? 'Đang mở camera…' : isVideoPlaying ? 'Camera đang bật' : error ? 'Thử mở camera lại' : 'Bật camera để quét'}
          </button>
          <p className="text-center text-xs leading-5 text-slate-600">Camera trực tiếp cần HTTPS và quyền truy cập. Nếu camera không hoạt động, hãy chụp/chọn ảnh QR hoặc nhập mã tài sản.</p>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3.5 text-right sm:px-5">
          <button type="button" onClick={onClose} className="min-h-11 w-full rounded-lg bg-slate-800 px-5 text-sm font-semibold text-white hover:bg-slate-900 sm:w-auto">Đóng máy quét</button>
        </footer>
      </section>
    </div>
  );
};
