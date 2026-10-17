import Foundation
import Network

/// Native macOS SMTP client using NWConnection over TLS on port 465.
/// Sends branded verification emails via Gmail without any external dependencies.
public actor SMTPSender {
    public static let shared = SMTPSender()

    private let host = NWEndpoint.Host("smtp.gmail.com")
    private let port = NWEndpoint.Port(rawValue: 465)!
    private let smtpUser = "theavdeshjadon@gmail.com"
    private let smtpPass = "sakfbbigrfyglgka"

    private var buffer = ""

    private init() {}

    /// Sends a 6-digit verification code with the AuraLoop Wordmark and dark theme
    public func sendOTP(to recipient: String, otp: String, recipientName: String) async throws {
        let subject = "\(otp) is your AuraLoop verification code"
        let htmlBody = buildHTML(recipientName: recipientName, otp: otp)

        let tlsOptions = NWProtocolTLS.Options()
        let params = NWParameters(tls: tlsOptions)
        let conn = NWConnection(host: host, port: port, using: params)
        self.buffer = ""

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            conn.stateUpdateHandler = { state in
                if state == .ready {
                    continuation.resume()
                } else if case .failed(let err) = state {
                    continuation.resume(throwing: err)
                }
            }
            conn.start(queue: .global())
        }

        func writeLine(_ str: String) async throws {
            let data = (str + "\r\n").data(using: .utf8)!
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                conn.send(content: data, completion: .contentProcessed({ err in
                    if let err = err { continuation.resume(throwing: err) }
                    else { continuation.resume() }
                }))
            }
        }

        func readUntil(expectCode: String) async throws -> String {
            while true {
                let chunk: String = try await withCheckedThrowingContinuation { continuation in
                    conn.receive(minimumIncompleteLength: 1, maximumLength: 4096) { data, _, _, err in
                        if let err = err {
                            continuation.resume(throwing: err)
                        } else if let data = data, let str = String(data: data, encoding: .utf8) {
                            continuation.resume(returning: str)
                        } else {
                            continuation.resume(throwing: NSError(
                                domain: "SMTP",
                                code: -1,
                                userInfo: [NSLocalizedDescriptionKey: "No response from SMTP server"]
                            ))
                        }
                    }
                }
                self.buffer += chunk
                let lines = self.buffer.components(separatedBy: "\r\n")
                if lines.contains(where: { $0.hasPrefix(expectCode + " ") }) {
                    let full = self.buffer
                    self.buffer = ""
                    return full
                } else if let errLine = lines.first(where: { $0.hasPrefix("5") || $0.hasPrefix("4") }) {
                    throw NSError(domain: "SMTP", code: -2, userInfo: [NSLocalizedDescriptionKey: errLine])
                }
            }
        }

        _ = try await readUntil(expectCode: "220")
        try await writeLine("EHLO localhost")
        _ = try await readUntil(expectCode: "250")
        try await writeLine("AUTH LOGIN")
        _ = try await readUntil(expectCode: "334")
        try await writeLine(Data(smtpUser.utf8).base64EncodedString())
        _ = try await readUntil(expectCode: "334")
        try await writeLine(Data(smtpPass.utf8).base64EncodedString())
        _ = try await readUntil(expectCode: "235")
        try await writeLine("MAIL FROM:<\(smtpUser)>")
        _ = try await readUntil(expectCode: "250")
        try await writeLine("RCPT TO:<\(recipient)>")
        _ = try await readUntil(expectCode: "250")
        try await writeLine("DATA")
        _ = try await readUntil(expectCode: "354")

        let emailContent = [
            "From: \"AuraLoop\" <\(smtpUser)>",
            "To: <\(recipient)>",
            "Subject: \(subject)",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=utf-8",
            "",
            htmlBody,
            "",
            "."
        ].joined(separator: "\r\n")

        try await writeLine(emailContent)
        _ = try await readUntil(expectCode: "250")
        try await writeLine("QUIT")
        conn.cancel()
    }

    private func buildHTML(recipientName: String, otp: String) -> String {
        let greetingName = recipientName.trimmingCharacters(in: .whitespaces).isEmpty ? "there" : recipientName

        return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AuraLoop Verification Code</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #07090e;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #f1f5f9;
            }
            .wrapper {
              width: 100%;
              max-width: 520px;
              margin: 40px auto;
              padding: 0 16px;
            }
            .card {
              background: linear-gradient(145deg, #10141f, #0c0e17);
              border: 1px solid rgba(255, 255, 255, 0.09);
              border-radius: 20px;
              padding: 44px 36px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }
            .wordmark-wrap {
              margin-bottom: 32px;
            }
            .wordmark {
              font-family: 'Avenir Next', -apple-system, sans-serif;
              font-size: 26px;
              font-weight: 300;
              letter-spacing: 12px;
              color: #ffffff;
              text-transform: uppercase;
              display: inline-block;
            }
            .infinity {
              font-size: 32px;
              font-weight: 400;
              color: #c084fc;
              letter-spacing: 2px;
              line-height: 0;
              vertical-align: middle;
            }
            .badge {
              display: inline-block;
              background: rgba(168, 85, 247, 0.12);
              border: 1px solid rgba(168, 85, 247, 0.28);
              color: #d8b4fe;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
              padding: 6px 14px;
              border-radius: 9999px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 22px;
              font-weight: 600;
              margin: 0 0 10px 0;
              color: #ffffff;
            }
            p.lead {
              font-size: 14px;
              color: #94a3b8;
              margin: 0 0 32px 0;
              line-height: 1.6;
            }
            .otp-box {
              background: #090b12;
              border: 1px solid rgba(192, 132, 252, 0.35);
              border-radius: 14px;
              padding: 22px 10px;
              font-family: ui-monospace, Menlo, Monaco, 'Courier New', monospace;
              font-size: 38px;
              font-weight: 800;
              letter-spacing: 12px;
              color: #f3e8ff;
              text-shadow: 0 0 16px rgba(168, 85, 247, 0.5);
              margin-bottom: 28px;
            }
            .footer-note {
              font-size: 13px;
              color: #64748b;
              margin: 0 0 20px 0;
              line-height: 1.5;
            }
            .divider {
              height: 1px;
              background: rgba(255, 255, 255, 0.06);
              margin: 32px 0 20px 0;
            }
            .sub-footer {
              font-size: 12px;
              color: #475569;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <!-- AuraLoop Wordmark with Infinity Double-O -->
              <div class="wordmark-wrap">
                <div class="wordmark">AURAL<span class="infinity">&#8734;</span>P</div>
              </div>

              <div class="badge">Verification Required</div>

              <h1>Hello, \(greetingName)!</h1>
              <p class="lead">Use the 6-digit verification code below to confirm your account and sign in to AuraLoop.</p>

              <div class="otp-box">\(otp)</div>

              <p class="footer-note">This code will expire in <strong>10 minutes</strong>. If you did not request this verification, you can safely ignore this email.</p>

              <div class="divider"></div>

              <div class="sub-footer">
                AuraLoop &middot; Live 4K Wallpapers for macOS
              </div>
            </div>
          </div>
        </body>
        </html>
        """
    }
}
